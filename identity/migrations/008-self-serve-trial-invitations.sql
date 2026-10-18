-- Self-serve Prospect trial invitations.
--
-- The Prospect platform asks for these over the service-authenticated
-- /internal/identity/self-serve-trial-invitations endpoint after it has
-- validated, rate limited and provisioned a public trial request. There is no
-- human actor session, so mirror_managed_issue (which requires a fresh
-- privileged passkey session) cannot be used. Instead the runtime role receives
-- two narrowly scoped SECURITY DEFINER functions that:
--   * can only create external/client principals (never privileged, never admin),
--   * cannot nominate an inviter: the recorded inviter, issuer and reconciler is
--     the dedicated, never-bound system principal below,
--   * refuse existing accounts, internal Mirror Progress mailboxes and companies,
--   * enforce hard daily ceilings and a resend throttle inside the database, so a
--     compromised platform secret cannot mint unbounded accounts or mail.
-- The application layer applies stricter, configurable limits in front of these.
--
-- Kill switch: UPDATE mirror_principal SET disabled=true
--   WHERE id='mirror-self-serve-trial';  -- both functions then refuse.

INSERT INTO mirror_principal(id,privileged,authorization_epoch)
  VALUES ('mirror-self-serve-trial',false,0) ON CONFLICT (id) DO NOTHING;

-- Trial length (days) shown in a self-serve invitation email. Prospect owns and
-- enforces the real trial term; NULL for invitations issued by people.
ALTER TABLE mirror_managed_invitation ADD COLUMN trial_days smallint
  CHECK (trial_days IS NULL OR trial_days BETWEEN 1 AND 365);

CREATE FUNCTION mirror_self_serve_issue(target text, invitation_hash text,
  mailbox text, display text, company text, trial_length integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor constant text := 'mirror-self-serve-trial'; at_time timestamptz := clock_timestamp();
  mailbox_domain text;
BEGIN
  -- Serialize self-serve issuance so the ceilings below cannot be raced.
  PERFORM pg_advisory_xact_lock(30401708);
  IF NOT EXISTS (SELECT 1 FROM public.mirror_principal WHERE id=actor AND NOT disabled AND NOT privileged)
    OR EXISTS (SELECT 1 FROM public.mirror_binding WHERE principal_id=actor) THEN
    RAISE EXCEPTION 'self-serve invitations disabled' USING ERRCODE='42501';
  END IF;
  IF target IS NULL OR target !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' OR
    invitation_hash IS NULL OR invitation_hash !~ '^[a-f0-9]{64}$' OR
    mailbox IS NULL OR mailbox<>lower(btrim(mailbox)) OR
    mailbox !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(mailbox)>254 OR
    display IS NULL OR length(btrim(display)) NOT BETWEEN 1 AND 120 OR
    company IS NULL OR length(btrim(company)) NOT BETWEEN 1 AND 120 OR
    trial_length IS NULL OR trial_length NOT BETWEEN 1 AND 365 OR
    lower(btrim(company))='mirror progress' OR split_part(mailbox,'@',2)='mirrorprogress.com' OR
    EXISTS (SELECT 1 FROM public."user" WHERE lower(email)=mailbox) OR
    EXISTS (SELECT 1 FROM public.mirror_principal WHERE id=target) THEN
    RAISE EXCEPTION 'ineligible self-serve invitation' USING ERRCODE='42501';
  END IF;
  mailbox_domain := split_part(mailbox,'@',2);
  IF (SELECT count(*) FROM public.mirror_managed_invitation
        WHERE inviter=actor AND created_at>at_time-interval '24 hours') >= 200 OR
     (SELECT count(*) FROM public.mirror_managed_invitation
        WHERE inviter=actor AND split_part(email,'@',2)=mailbox_domain
          AND created_at>at_time-interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'self-serve invitation ceiling reached' USING ERRCODE='54000';
  END IF;
  INSERT INTO public.mirror_principal(id,privileged,authorization_epoch) VALUES (target,false,0);
  INSERT INTO public.mirror_staging_reconciliation(principal_id,epoch,email,reconciler,review_ref)
    VALUES (target,0,mailbox,actor,'Self-serve Prospect trial invitation');
  INSERT INTO public.mirror_staging_invitation(digest,principal_id,epoch,email,issuer,created_at,expires_at)
    VALUES (invitation_hash,target,0,mailbox,actor,at_time,at_time+interval '7 days');
  INSERT INTO public.mirror_managed_invitation(principal_id,invitation_digest,email,display_name,company_name,
    account_type,requested_role,inviter,trial_days)
    VALUES (target,invitation_hash,mailbox,btrim(display),btrim(company),'external','client',actor,trial_length);
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('self-serve-invite',session_user,actor,target,0,'Self-serve Prospect trial invitation');
END $$;

-- Re-delivers a still-pending self-serve invitation with a fresh link. Only
-- invitations the self-serve principal issued qualify; at most one resend per
-- 15 minutes and three per day per invitation.
CREATE FUNCTION mirror_self_serve_resend(target text, replacement_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor constant text := 'mirror-self-serve-trial'; prior public.mirror_managed_invitation;
  p public.mirror_principal; last_issued timestamptz; at_time timestamptz := clock_timestamp();
BEGIN
  PERFORM pg_advisory_xact_lock(30401708);
  IF NOT EXISTS (SELECT 1 FROM public.mirror_principal WHERE id=actor AND NOT disabled AND NOT privileged)
    OR EXISTS (SELECT 1 FROM public.mirror_binding WHERE principal_id=actor) THEN
    RAISE EXCEPTION 'self-serve invitations disabled' USING ERRCODE='42501';
  END IF;
  SELECT * INTO prior FROM public.mirror_managed_invitation WHERE principal_id=target FOR UPDATE;
  SELECT * INTO p FROM public.mirror_principal WHERE id=target FOR UPDATE;
  IF prior.principal_id IS NULL OR p.id IS NULL OR prior.inviter<>actor OR
    prior.account_type<>'external' OR prior.requested_role<>'client' OR prior.revoked_at IS NOT NULL OR
    p.disabled OR p.privileged OR replacement_hash IS NULL OR replacement_hash !~ '^[a-f0-9]{64}$' OR
    EXISTS (SELECT 1 FROM public.mirror_binding WHERE principal_id=target) THEN
    RAISE EXCEPTION 'ineligible self-serve resend' USING ERRCODE='42501';
  END IF;
  SELECT created_at INTO last_issued FROM public.mirror_staging_invitation WHERE digest=prior.invitation_digest;
  IF last_issued IS NULL OR last_issued>at_time-interval '15 minutes' OR
    (SELECT count(*) FROM public.mirror_staging_audit WHERE kind='self-serve-resend'
      AND principal_id=target AND created_at>at_time-interval '24 hours') >= 3 THEN
    RAISE EXCEPTION 'self-serve resend throttled' USING ERRCODE='54000';
  END IF;
  UPDATE public.mirror_staging_invitation SET consumed_at=at_time
    WHERE digest=prior.invitation_digest AND consumed_at IS NULL;
  UPDATE public.mirror_staging_delivery SET status='cancelled',sealed_payload=NULL,lease_until=NULL
    WHERE id IN (SELECT id FROM public.mirror_staging_mailbox WHERE invitation_digest=prior.invitation_digest)
      AND status IN ('queued','sending','failed');
  INSERT INTO public.mirror_staging_invitation(digest,principal_id,epoch,email,issuer,created_at,expires_at)
    VALUES (replacement_hash,target,p.authorization_epoch,prior.email,actor,at_time,at_time+interval '7 days');
  UPDATE public.mirror_managed_invitation SET invitation_digest=replacement_hash WHERE principal_id=target;
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('self-serve-resend',session_user,actor,target,p.authorization_epoch,'Resent self-serve Prospect trial invitation');
END $$;
REVOKE ALL ON FUNCTION mirror_self_serve_issue(text,text,text,text,text,integer),
  mirror_self_serve_resend(text,text) FROM PUBLIC;
