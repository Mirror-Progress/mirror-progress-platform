-- Trial managers may resend pending external Prospect invitations issued by any
-- manager. General account invitations and revocation remain admin-only.
CREATE OR REPLACE FUNCTION mirror_managed_resend(actor_session text, target text, replacement_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor text; prior public.mirror_managed_invitation; p public.mirror_principal; at_time timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO STRICT prior FROM public.mirror_managed_invitation WHERE principal_id=target FOR UPDATE;
  SELECT b.principal_id INTO actor FROM public."session" s
    JOIN public.mirror_binding b ON b.user_id=s."userId"
    JOIN public.mirror_principal a ON a.id=b.principal_id
    JOIN public.mirror_assurance e ON e.session_id=s.id AND e.user_id=s."userId"
      AND e.principal_id=a.id AND e.epoch=a.authorization_epoch
    WHERE s.id=actor_session AND s."expiresAt">at_time AND NOT a.disabled AND a.privileged
      AND e.factor='passkey_uv' AND e.mfa_at>at_time-interval '5 minutes' AND e.expires_at>at_time
      AND (EXISTS (SELECT 1 FROM public.mirror_managed_invitation_admin ia
        WHERE ia.principal_id=a.id AND ia.active)
        OR (prior.account_type='external' AND EXISTS (
          SELECT 1 FROM public.mirror_trial_invitation_manager tm
          WHERE tm.principal_id=a.id AND tm.active)));
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
  UPDATE public.mirror_managed_invitation SET invitation_digest=replacement_hash WHERE principal_id=target;
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('managed-resend',session_user,actor,target,p.authorization_epoch,'Resent Prospect account invitation');
END $$;
REVOKE ALL ON FUNCTION mirror_managed_resend(text,text,text) FROM PUBLIC;
