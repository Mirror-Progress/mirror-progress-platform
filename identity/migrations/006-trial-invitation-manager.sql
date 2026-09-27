-- Jahlon is an enrolled internal project lead. Grant trial-only invitation
-- authority without promoting his account or enabling general account invites.
CREATE TABLE mirror_trial_invitation_manager (
  principal_id text PRIMARY KEY REFERENCES mirror_principal(id),
  active boolean NOT NULL DEFAULT true
);
INSERT INTO mirror_trial_invitation_manager(principal_id)
SELECT m.principal_id FROM mirror_managed_invitation m
JOIN mirror_binding b ON b.principal_id=m.principal_id
JOIN mirror_principal p ON p.id=m.principal_id
WHERE lower(m.display_name)='jahlon burruss'
  AND m.account_type='admin' AND m.requested_role='project_lead'
  AND m.revoked_at IS NULL AND p.privileged AND NOT p.disabled
ON CONFLICT DO NOTHING;
REVOKE ALL ON mirror_trial_invitation_manager FROM PUBLIC;

CREATE OR REPLACE FUNCTION mirror_managed_issue(actor_session text, target text, invitation_hash text,
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
      AND a.expires_at>at_time AND (EXISTS (
        SELECT 1 FROM public.mirror_managed_invitation_admin ia WHERE ia.principal_id=p.id AND ia.active)
        OR (kind='external' AND requested='client' AND EXISTS (
          SELECT 1 FROM public.mirror_trial_invitation_manager tm WHERE tm.principal_id=p.id AND tm.active)))
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
