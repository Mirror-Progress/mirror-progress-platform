-- Additive. Apply after the pinned Better Auth schema and UNCHANGED 001.
-- The migration owner provisions login->human-principal mappings out of band.
CREATE TABLE mirror_staging_operator (
  login_role text PRIMARY KEY, principal_id text NOT NULL REFERENCES mirror_principal(id),
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE mirror_staging_reconciliation (
  principal_id text NOT NULL REFERENCES mirror_principal(id), epoch bigint NOT NULL CHECK (epoch >= 0),
  email text NOT NULL CHECK (email = lower(email) AND email = btrim(email) AND length(email) BETWEEN 3 AND 254
    AND email !~ '[[:space:][:cntrl:]]' AND email ~ '^[^@]+@[^@]+$'),
  reconciler text NOT NULL REFERENCES mirror_principal(id), review_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (principal_id,epoch), UNIQUE (principal_id,epoch,email)
);
CREATE TABLE mirror_staging_invitation (
  digest text PRIMARY KEY CHECK (digest ~ '^[a-f0-9]{64}$'),
  principal_id text NOT NULL, epoch bigint NOT NULL, email text NOT NULL,
  issuer text NOT NULL REFERENCES mirror_principal(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  FOREIGN KEY (principal_id,epoch,email) REFERENCES mirror_staging_reconciliation(principal_id,epoch,email),
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '15 minutes')
);
CREATE INDEX ON mirror_staging_invitation(principal_id);
CREATE TABLE mirror_staging_mailbox (
  id text PRIMARY KEY, invitation_digest text NOT NULL UNIQUE REFERENCES mirror_staging_invitation(digest),
  token_digest text NOT NULL UNIQUE CHECK (token_digest ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '10 minutes')
);
CREATE TABLE mirror_staging_delivery (
  id text PRIMARY KEY REFERENCES mirror_staging_mailbox(id), sealed_payload text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5), lease_until timestamptz,
  accepted_at timestamptz, last_error text CHECK (last_error IS NULL OR last_error = 'transport_failed')
);
CREATE INDEX ON mirror_staging_delivery(status,lease_until);
CREATE TABLE mirror_staging_enrollment (
  user_id text PRIMARY KEY REFERENCES "user"(id), principal_id text NOT NULL UNIQUE REFERENCES mirror_principal(id),
  epoch bigint NOT NULL, email text NOT NULL,
  invitation_digest text NOT NULL UNIQUE REFERENCES mirror_staging_invitation(digest),
  mailbox_id text NOT NULL UNIQUE REFERENCES mirror_staging_mailbox(id),
  verified_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (principal_id,epoch,email) REFERENCES mirror_staging_reconciliation(principal_id,epoch,email),
  UNIQUE (user_id,email)
);
CREATE TABLE mirror_staging_approval (
  principal_id text NOT NULL REFERENCES mirror_principal(id), user_id text NOT NULL,
  epoch bigint NOT NULL CHECK (epoch >= 0), email text NOT NULL,
  approver text NOT NULL REFERENCES mirror_principal(id),
  approved_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL,
  PRIMARY KEY (principal_id,epoch,approved_at),
  FOREIGN KEY (user_id,email) REFERENCES mirror_staging_enrollment(user_id,email),
  CHECK (approver <> principal_id AND expires_at > approved_at AND expires_at <= approved_at + interval '24 hours')
);
CREATE TABLE mirror_staging_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, kind text NOT NULL,
  operator_login text NOT NULL, actor text NOT NULL, principal_id text NOT NULL, epoch bigint NOT NULL,
  review_ref text NOT NULL CHECK (length(btrim(review_ref)) BETWEEN 8 AND 200),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
-- No browser argument, SET ROLE, or runtime credential can choose the audit actor.
CREATE FUNCTION mirror_staging_actor() RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE actor text;
BEGIN
  SELECT o.principal_id INTO actor FROM public.mirror_staging_operator o
    JOIN public.mirror_principal p ON p.id=o.principal_id
    WHERE o.login_role=session_user::text AND o.active AND NOT p.disabled;
  IF actor IS NULL THEN RAISE EXCEPTION 'unregistered operator' USING ERRCODE='42501'; END IF;
  RETURN actor;
END $$;
CREATE FUNCTION mirror_staging_reconcile(target text, expected_epoch bigint, mailbox text, review text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor text := public.mirror_staging_actor(); p public.mirror_principal;
BEGIN
  SELECT * INTO STRICT p FROM public.mirror_principal WHERE id=target FOR SHARE;
  IF p.disabled OR p.authorization_epoch<>expected_epoch OR actor=target OR
    EXISTS (SELECT 1 FROM public.mirror_binding WHERE principal_id=target) THEN
    RAISE EXCEPTION 'ineligible reconciliation';
  END IF;
  INSERT INTO public.mirror_staging_reconciliation(principal_id,epoch,email,reconciler,review_ref)
    VALUES (target,expected_epoch,mailbox,actor,review);
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('reconcile',session_user,actor,target,expected_epoch,review);
END $$;
CREATE FUNCTION mirror_staging_issue(target text, expected_epoch bigint, invitation_hash text, review text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor text := public.mirror_staging_actor(); p public.mirror_principal;
  r public.mirror_staging_reconciliation; at_time timestamptz;
BEGIN
  SELECT * INTO STRICT p FROM public.mirror_principal WHERE id=target FOR SHARE;
  IF p.disabled OR p.authorization_epoch<>expected_epoch OR actor=target OR
    EXISTS (SELECT 1 FROM public.mirror_binding WHERE principal_id=target) THEN
    RAISE EXCEPTION 'ineligible invitation';
  END IF;
  SELECT * INTO STRICT r FROM public.mirror_staging_reconciliation WHERE principal_id=target AND epoch=expected_epoch;
  at_time := clock_timestamp();
  INSERT INTO public.mirror_staging_invitation(digest,principal_id,epoch,email,issuer,created_at,expires_at)
    VALUES (invitation_hash,target,expected_epoch,r.email,actor,at_time,at_time+interval '15 minutes');
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('invite',session_user,actor,target,expected_epoch,review);
END $$;
CREATE FUNCTION mirror_staging_approve(target text, expected_epoch bigint, review text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor text := public.mirror_staging_actor(); p public.mirror_principal;
  e public.mirror_staging_enrollment; i public.mirror_staging_invitation;
  r public.mirror_staging_reconciliation; at_time timestamptz;
BEGIN
  SELECT * INTO STRICT p FROM public.mirror_principal WHERE id=target FOR SHARE;
  SELECT * INTO STRICT e FROM public.mirror_staging_enrollment WHERE principal_id=target;
  SELECT * INTO STRICT i FROM public.mirror_staging_invitation WHERE digest=e.invitation_digest;
  SELECT * INTO STRICT r FROM public.mirror_staging_reconciliation WHERE principal_id=target AND epoch=e.epoch;
  IF p.disabled OR NOT p.privileged OR p.authorization_epoch<>expected_epoch OR
    actor IN (target,i.issuer,r.reconciler) THEN RAISE EXCEPTION 'independent approval required'; END IF;
  at_time := clock_timestamp();
  INSERT INTO public.mirror_staging_approval(principal_id,user_id,epoch,email,approver,approved_at,expires_at)
    VALUES (target,e.user_id,expected_epoch,e.email,actor,at_time,at_time+interval '24 hours');
  INSERT INTO public.mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref)
    VALUES ('independent-approve',session_user,actor,target,expected_epoch,review);
END $$;
REVOKE ALL ON FUNCTION mirror_staging_actor(), mirror_staging_reconcile(text,bigint,text,text),
  mirror_staging_issue(text,bigint,text,text), mirror_staging_approve(text,bigint,text) FROM PUBLIC;
REVOKE ALL ON mirror_staging_operator, mirror_staging_reconciliation, mirror_staging_invitation,
  mirror_staging_mailbox, mirror_staging_delivery, mirror_staging_enrollment, mirror_staging_approval,
  mirror_staging_audit FROM PUBLIC;
