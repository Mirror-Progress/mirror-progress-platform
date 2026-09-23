-- A fresh-install invitation is delivered to the selected mailbox. The mailed
-- bearer link is also the mailbox proof, so recipients receive one email.
ALTER TABLE mirror_staging_invitation DROP CONSTRAINT mirror_staging_invitation_check;
ALTER TABLE mirror_staging_mailbox DROP CONSTRAINT mirror_staging_mailbox_check;
ALTER TABLE mirror_staging_invitation ADD CONSTRAINT mirror_invitation_lifetime
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '7 days');
ALTER TABLE mirror_staging_mailbox ADD CONSTRAINT mirror_mailbox_lifetime
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '7 days');

CREATE TABLE mirror_managed_invitation (
  principal_id text PRIMARY KEY REFERENCES mirror_principal(id),
  invitation_digest text NOT NULL UNIQUE REFERENCES mirror_staging_invitation(digest),
  email text NOT NULL,
  display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 120),
  company_name text NOT NULL CHECK (length(btrim(company_name)) BETWEEN 1 AND 120),
  account_type text NOT NULL CHECK (account_type IN ('admin','external')),
  requested_role text NOT NULL CHECK (requested_role IN ('admin','project_lead','client')),
  inviter text NOT NULL REFERENCES mirror_principal(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  revoked_at timestamptz,
  CHECK ((account_type='external' AND requested_role='client') OR
    (account_type='admin' AND requested_role IN ('admin','project_lead')))
);
CREATE UNIQUE INDEX mirror_managed_invitation_email_active ON mirror_managed_invitation(lower(email)) WHERE revoked_at IS NULL;
ALTER TABLE mirror_staging_delivery ADD COLUMN purpose text NOT NULL DEFAULT 'mailbox'
  CHECK (purpose IN ('mailbox','invitation'));

-- The database validates the real passkey-backed Identity session. A caller
-- cannot nominate an arbitrary inviter ID, role, or already-bound target.
CREATE FUNCTION mirror_managed_issue(actor_session text, target text, invitation_hash text,
  mailbox text, display text, company text, kind text, requested text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor text; at_time timestamptz := clock_timestamp();
BEGIN
  SELECT b.principal_id INTO actor FROM public."session" s
    JOIN public.mirror_binding b ON b.user_id=s."userId"
    JOIN public.mirror_principal p ON p.id=b.principal_id
    JOIN public.mirror_assurance a ON a.session_id=s.id AND a.user_id=s."userId"
      AND a.principal_id=p.id AND a.epoch=p.authorization_epoch
    WHERE s.id=actor_session AND s."expiresAt">at_time AND NOT p.disabled AND p.privileged
      AND a.factor='passkey_uv' AND a.mfa_at>at_time-interval '5 minutes'
      AND a.expires_at>at_time AND EXISTS (
        SELECT 1 FROM public.mirror_managed_invitation_admin ia WHERE ia.principal_id=p.id AND ia.active)
    FOR SHARE OF p;
  IF actor IS NULL OR actor=target OR
    mailbox<>lower(btrim(mailbox)) OR mailbox !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR
    length(mailbox)>254 OR length(btrim(display)) NOT BETWEEN 1 AND 120 OR
    length(btrim(company)) NOT BETWEEN 1 AND 120 OR
    EXISTS (SELECT 1 FROM public."user" WHERE email=mailbox) OR
    NOT ((kind='external' AND requested='client') OR
      (kind='admin' AND company='Mirror Progress' AND requested IN ('admin','project_lead'))) THEN
    RAISE EXCEPTION 'ineligible managed invitation' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.mirror_principal(id,privileged,authorization_epoch)
    VALUES (target,requested<>'client',0);
  INSERT INTO public.mirror_staging_reconciliation(principal_id,epoch,email,reconciler,review_ref)
    VALUES (target,0,mailbox,actor,'Owner-issued fresh account invitation');
  INSERT INTO public.mirror_staging_invitation(digest,principal_id,epoch,email,issuer,created_at,expires_at)
    VALUES (invitation_hash,target,0,mailbox,actor,at_time,at_time+interval '7 days');
  INSERT INTO public.mirror_managed_invitation(principal_id,invitation_digest,email,display_name,company_name,
    account_type,requested_role,inviter)
    VALUES (target,invitation_hash,mailbox,btrim(display),btrim(company),kind,requested,actor);
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('managed-invite',session_user,actor,target,0,'Owner-issued fresh account invitation');
END $$;

CREATE TABLE mirror_managed_invitation_admin (
  principal_id text PRIMARY KEY REFERENCES mirror_principal(id), active boolean NOT NULL DEFAULT true
);
-- On fresh production there is one enrolled privileged owner. Later admins do
-- not gain invitation authority merely by being invited as admins.
INSERT INTO mirror_managed_invitation_admin(principal_id)
SELECT p.id FROM mirror_principal p JOIN mirror_binding b ON b.principal_id=p.id
WHERE p.privileged AND NOT p.disabled ON CONFLICT DO NOTHING;

CREATE FUNCTION mirror_managed_resend(actor_session text, target text, replacement_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor text; prior public.mirror_managed_invitation; p public.mirror_principal; at_time timestamptz := clock_timestamp();
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
  SELECT * INTO STRICT p FROM public.mirror_principal WHERE id=target FOR UPDATE;
  IF actor IS NULL OR actor=target OR prior.revoked_at IS NOT NULL OR p.disabled OR
    EXISTS (SELECT 1 FROM public.mirror_binding WHERE principal_id=target) THEN
    RAISE EXCEPTION 'ineligible managed resend' USING ERRCODE='42501';
  END IF;
  UPDATE public.mirror_staging_invitation SET consumed_at=at_time
    WHERE digest=prior.invitation_digest AND consumed_at IS NULL;
  UPDATE public.mirror_staging_delivery SET status='cancelled',sealed_payload=NULL,lease_until=NULL
    WHERE id IN (SELECT id FROM public.mirror_staging_mailbox WHERE invitation_digest=prior.invitation_digest)
      AND status IN ('queued','sending','failed');
  INSERT INTO public.mirror_staging_invitation(digest,principal_id,epoch,email,issuer,created_at,expires_at)
    VALUES (replacement_hash,target,p.authorization_epoch,prior.email,actor,at_time,at_time+interval '7 days');
  UPDATE public.mirror_managed_invitation SET invitation_digest=replacement_hash
    WHERE principal_id=target;
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('managed-resend',session_user,actor,target,p.authorization_epoch,'Owner resent fresh account invitation');
END $$;

ALTER TABLE mirror_security_outbox DROP CONSTRAINT mirror_security_outbox_kind_check;
ALTER TABLE mirror_security_outbox ADD CONSTRAINT mirror_security_outbox_kind_check
  CHECK (kind IN ('recovery','global_logout','invite_revoke'));
CREATE FUNCTION mirror_managed_revoke(actor_session text, target text)
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
  END IF;
  INSERT INTO public.mirror_security_outbox(principal_id,epoch,kind) VALUES (target,next_epoch,'invite_revoke');
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('managed-revoke',session_user,actor,target,next_epoch,'Owner revoked managed account');
END $$;
REVOKE ALL ON mirror_managed_invitation,mirror_managed_invitation_admin FROM PUBLIC;
REVOKE ALL ON FUNCTION mirror_managed_issue(text,text,text,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION mirror_managed_resend(text,text,text),mirror_managed_revoke(text,text) FROM PUBLIC;
