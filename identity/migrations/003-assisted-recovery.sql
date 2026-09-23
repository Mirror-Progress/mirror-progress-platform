-- Assisted recovery is an operator procedure, never mailbox-only or public password reset.
CREATE TABLE mirror_staging_recovery (
  id text PRIMARY KEY,
  principal_id text NOT NULL REFERENCES mirror_principal(id),
  user_id text NOT NULL REFERENCES "user"(id),
  epoch bigint NOT NULL CHECK (epoch >= 0),
  requester text NOT NULL REFERENCES mirror_principal(id),
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  approver text REFERENCES mirror_principal(id),
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '15 minutes'),
  CHECK ((consumed_at IS NULL AND password_hash IS NOT NULL AND password_hash ~ '^[a-f0-9]{32}:[a-f0-9]{128}$' AND approver IS NULL)
    OR (consumed_at IS NOT NULL AND password_hash IS NULL AND approver IS NOT NULL))
);
CREATE FUNCTION mirror_staging_request_recovery(request_id text, target text, expected_epoch bigint, new_hash text, review text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor text := public.mirror_staging_actor(); p public.mirror_principal;
  target_user text; at_time timestamptz;
BEGIN
  SELECT * INTO STRICT p FROM public.mirror_principal WHERE id=target FOR UPDATE;
  IF p.disabled OR actor=target OR p.authorization_epoch<>expected_epoch OR
     request_id !~ '^[a-f0-9-]{36}$' OR new_hash IS NULL OR new_hash !~ '^[a-f0-9]{32}:[a-f0-9]{128}$' THEN
    RAISE EXCEPTION 'ineligible recovery';
  END IF;
  SELECT b.user_id INTO STRICT target_user FROM public.mirror_binding b
    JOIN public.mirror_staging_enrollment e ON e.user_id=b.user_id AND e.principal_id=b.principal_id
    WHERE b.principal_id=target;
  at_time := clock_timestamp();
  INSERT INTO public.mirror_staging_recovery(id,principal_id,user_id,epoch,requester,password_hash,created_at,expires_at)
    VALUES (request_id,target,target_user,expected_epoch,actor,new_hash,at_time,at_time+interval '15 minutes');
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('recovery-request',session_user,actor,target,expected_epoch,review);
END $$;
CREATE FUNCTION mirror_staging_approve_recovery(request_id text, review text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor text := public.mirror_staging_actor(); p public.mirror_principal;
  recovery public.mirror_staging_recovery; target text; changed integer;
BEGIN
  SELECT principal_id INTO STRICT target FROM public.mirror_staging_recovery WHERE id=request_id;
  -- Lock in the same order as enrollment/revocation and reread after the principal lock.
  SELECT * INTO STRICT p FROM public.mirror_principal WHERE id=target FOR UPDATE;
  SELECT * INTO STRICT recovery FROM public.mirror_staging_recovery WHERE id=request_id FOR UPDATE;
  IF p.disabled OR p.authorization_epoch<>recovery.epoch OR actor IN (target,recovery.requester) OR
      recovery.consumed_at IS NOT NULL OR recovery.expires_at<=clock_timestamp() OR
      NOT EXISTS (SELECT 1 FROM public.mirror_binding WHERE principal_id=target AND user_id=recovery.user_id) THEN
    RAISE EXCEPTION 'independent recovery approval required';
  END IF;
  IF p.privileged AND EXISTS (
    SELECT 1 FROM public.mirror_staging_enrollment e
    JOIN public.mirror_staging_invitation i ON i.digest=e.invitation_digest
    JOIN public.mirror_staging_reconciliation r ON r.principal_id=i.principal_id AND r.epoch=i.epoch
    WHERE e.user_id=recovery.user_id AND actor IN (i.issuer,r.reconciler)
  ) THEN RAISE EXCEPTION 'independent recovery approval required'; END IF;
  UPDATE public."account" SET password=recovery.password_hash,"updatedAt"=clock_timestamp()
    WHERE "userId"=recovery.user_id AND "providerId"='credential';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION 'credential recovery conflict'; END IF;
  DELETE FROM public."twoFactor" WHERE "userId"=recovery.user_id;
  DELETE FROM public.passkey WHERE "userId"=recovery.user_id;
  UPDATE public."user" SET "twoFactorEnabled"=false,"updatedAt"=clock_timestamp() WHERE id=recovery.user_id;
  PERFORM public.mirror_revoke_subject(recovery.user_id,'recovery');
  UPDATE public.mirror_staging_recovery SET consumed_at=clock_timestamp(),password_hash=NULL,approver=actor WHERE id=request_id;
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('recovery-approved',session_user,actor,target,recovery.epoch,review);
  -- No principal enable, mailbox change, membership change, session creation or assurance upgrade.
  -- New privileged access needs approval at the advanced epoch plus a later UV assertion.
END $$;
REVOKE ALL ON mirror_staging_recovery FROM PUBLIC;
REVOKE ALL ON FUNCTION mirror_staging_request_recovery(text,text,bigint,text,text),
  mirror_staging_approve_recovery(text,text) FROM PUBLIC;
