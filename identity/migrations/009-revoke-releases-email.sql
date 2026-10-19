-- Revoking a person releases their email address.
--
-- mirror_managed_issue (006) and mirror_self_serve_issue (008) refuse any
-- mailbox that is still the email of a Better Auth "user" row. Revocation (004)
-- disabled the principal but left the bound user's email in place, so a revoked
-- person could never be invited again with the same address.
--
-- From this migration, mirror_managed_revoke also, in the same transaction:
--   * renames the bound user's email to revoked-<userId>@revoked.invalid
--     (RFC 2606 .invalid: never routable, unique per user, at most 254 chars;
--     "emailVerified" is left as it was),
--   * deletes pending Better Auth password-reset verification rows for that user
--     (identifier 'reset-password:<token>', value = user id).
-- Every other behaviour of the 004 definition is unchanged: the same fresh
-- passkey admin check, row locks, principal disable + epoch bump, invitation
-- consumption, delivery cancellation, session/password-flow deletion, outbox
-- and audit rows. The function stays SECURITY DEFINER with the same
-- search_path; CREATE OR REPLACE keeps its owner and EXECUTE grants, so the
-- runtime role needs nothing new.
--
-- The original address remains on mirror_managed_invitation.email (and the
-- enrollment/reconciliation history), so the admin list still shows who was
-- revoked. Applied migrations 001-008 are not edited.

CREATE OR REPLACE FUNCTION mirror_managed_revoke(actor_session text, target text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor text; prior public.mirror_managed_invitation; next_epoch bigint; bound_user text;
  at_time timestamptz := clock_timestamp();
BEGIN
  SELECT b.principal_id INTO actor FROM public."session" s
    JOIN public.mirror_binding b ON b.user_id=s."userId"
    JOIN public.mirror_principal a ON a.id=b.principal_id
    JOIN public.mirror_assurance e ON e.session_id=s.id AND e.user_id=s."userId"
      AND e.principal_id=a.id AND e.epoch=a.authorization_epoch
    WHERE s.id=actor_session AND s."expiresAt">at_time AND NOT a.disabled AND a.privileged
      AND e.factor='passkey_uv' AND e.mfa_at>at_time-interval '5 minutes' AND e.expires_at>at_time
      AND EXISTS (SELECT 1 FROM public.mirror_managed_invitation_admin ia WHERE ia.principal_id=a.id AND ia.active);
  SELECT * INTO STRICT prior FROM public.mirror_managed_invitation WHERE principal_id=target FOR UPDATE;
  IF actor IS NULL OR actor=target OR prior.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'ineligible managed revoke' USING ERRCODE='42501';
  END IF;
  UPDATE public.mirror_managed_invitation SET revoked_at=at_time WHERE principal_id=target;
  UPDATE public.mirror_principal SET disabled=true,authorization_epoch=authorization_epoch+1
    WHERE id=target RETURNING authorization_epoch INTO next_epoch;
  UPDATE public.mirror_staging_invitation SET consumed_at=at_time
    WHERE digest=prior.invitation_digest AND consumed_at IS NULL;
  UPDATE public.mirror_staging_delivery SET status='cancelled',sealed_payload=NULL,lease_until=NULL
    WHERE id IN (SELECT id FROM public.mirror_staging_mailbox WHERE invitation_digest=prior.invitation_digest)
      AND status IN ('queued','sending','failed');
  SELECT user_id INTO bound_user FROM public.mirror_binding WHERE principal_id=target;
  IF bound_user IS NOT NULL THEN
    DELETE FROM public."session" WHERE "userId"=bound_user;
    DELETE FROM public.mirror_password_flow WHERE user_id=bound_user;
    DELETE FROM public.verification WHERE identifier LIKE 'reset-password:%' AND value=bound_user;
    UPDATE public."user" SET email='revoked-'||
        (CASE WHEN length(bound_user)<=230 THEN bound_user ELSE md5(bound_user) END)||'@revoked.invalid',
      "updatedAt"=at_time
      WHERE id=bound_user;
  END IF;
  INSERT INTO public.mirror_security_outbox(principal_id,epoch,kind) VALUES (target,next_epoch,'invite_revoke');
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('managed-revoke',session_user,actor,target,next_epoch,'Owner revoked managed account');
END $$;
REVOKE ALL ON FUNCTION mirror_managed_revoke(text,text) FROM PUBLIC;

-- One-time backfill for people revoked before this migration. Users whose
-- email already ends in .invalid (renamed by hand by an operator) are left as
-- they are, so running this on a partly cleaned database changes only the rest.
UPDATE "user" u SET email='revoked-'||
    (CASE WHEN length(u.id)<=230 THEN u.id ELSE md5(u.id) END)||'@revoked.invalid',
  "updatedAt"=clock_timestamp()
  FROM mirror_binding b
  JOIN mirror_principal p ON p.id=b.principal_id
  JOIN mirror_managed_invitation m ON m.principal_id=p.id
  WHERE b.user_id=u.id AND p.disabled AND m.revoked_at IS NOT NULL
    AND lower(u.email) NOT LIKE '%.invalid';

-- A disabled principal cannot be authorized, but leftover sessions, password
-- flows and reset links of its user are removed so nothing lingers.
DELETE FROM "session" s USING mirror_binding b JOIN mirror_principal p ON p.id=b.principal_id
  WHERE s."userId"=b.user_id AND p.disabled;
DELETE FROM mirror_password_flow f USING mirror_binding b JOIN mirror_principal p ON p.id=b.principal_id
  WHERE f.user_id=b.user_id AND p.disabled;
DELETE FROM verification v USING mirror_binding b JOIN mirror_principal p ON p.id=b.principal_id
  WHERE v.identifier LIKE 'reset-password:%' AND v.value=b.user_id AND p.disabled;
