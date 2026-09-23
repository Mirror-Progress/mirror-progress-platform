-- Applied AFTER the pinned Better Auth schema by scripts/migrate.ts.
-- Application-owned authorization state, not a copy of State Kernel roles.
CREATE TABLE IF NOT EXISTS mirror_principal (
  id text PRIMARY KEY,
  disabled boolean NOT NULL DEFAULT false,
  privileged boolean NOT NULL DEFAULT false,
  authorization_epoch bigint NOT NULL DEFAULT 0 CHECK (authorization_epoch >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mirror_binding (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  principal_id text NOT NULL UNIQUE REFERENCES mirror_principal(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mirror_invitation (
  digest text PRIMARY KEY CHECK (digest ~ '^[a-f0-9]{64}$'),
  principal_id text NOT NULL REFERENCES mirror_principal(id),
  email text NOT NULL CHECK (email = lower(email)),
  issuer_ref text NOT NULL,
  evidence_kind text NOT NULL CHECK (evidence_kind = 'synthetic-only'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '15 minutes')
);
CREATE INDEX IF NOT EXISTS mirror_invitation_principal ON mirror_invitation(principal_id);
CREATE TABLE IF NOT EXISTS mirror_assurance (
  session_id text PRIMARY KEY REFERENCES "session"(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  principal_id text NOT NULL REFERENCES mirror_principal(id),
  epoch bigint NOT NULL,
  password_at timestamptz,
  mfa_at timestamptz,
  factor text CHECK (factor IN ('password_totp', 'passkey_uv')),
  expires_at timestamptz NOT NULL,
  CHECK ((factor IS NULL AND mfa_at IS NULL) OR (factor IS NOT NULL AND mfa_at IS NOT NULL)),
  CHECK (factor <> 'password_totp' OR (password_at IS NOT NULL AND password_at <= mfa_at))
);
CREATE TABLE IF NOT EXISTS mirror_password_flow (
  digest text PRIMARY KEY CHECK (digest ~ '^[a-f0-9]{64}$'),
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  epoch bigint NOT NULL CHECK (epoch >= 0),
  auth_cookie_digest text NOT NULL CHECK (auth_cookie_digest ~ '^[a-f0-9]{64}$'),
  password_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CHECK (expires_at <= password_at + interval '5 minutes')
);
CREATE INDEX IF NOT EXISTS mirror_password_flow_expiry ON mirror_password_flow(expires_at);
-- A keyed digest of an already verified TOTP, retained for a short replay window.
-- This is not a TOTP seed or an unkeyed hash of a low-entropy six-digit code.
CREATE TABLE IF NOT EXISTS mirror_totp_replay (
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, digest)
);
CREATE INDEX IF NOT EXISTS mirror_totp_replay_expiry ON mirror_totp_replay(expires_at);
CREATE TABLE IF NOT EXISTS mirror_rate_limit (
  key text PRIMARY KEY,
  window_start bigint NOT NULL,
  count integer NOT NULL CHECK (count >= 1)
);
-- Local transactional outbox for downstream invalidation. No dispatcher exists in batch 1.
-- It intentionally contains identifiers and epochs only, never bearer tokens or emails.
CREATE TABLE IF NOT EXISTS mirror_security_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  principal_id text NOT NULL REFERENCES mirror_principal(id),
  epoch bigint NOT NULL,
  kind text NOT NULL CHECK (kind IN ('recovery', 'global_logout')),
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);
-- SECURITY DEFINER supplies ONLY monotonic revocation, not activation or approval.
CREATE OR REPLACE FUNCTION mirror_revoke_subject(target_user text, event_kind text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE p_id text; next_epoch bigint;
BEGIN
  IF event_kind NOT IN ('recovery', 'global_logout') THEN RAISE EXCEPTION 'invalid event'; END IF;
  SELECT principal_id INTO STRICT p_id FROM public.mirror_binding WHERE user_id = target_user;
  UPDATE public.mirror_principal SET authorization_epoch = authorization_epoch + 1
    WHERE id = p_id RETURNING authorization_epoch INTO next_epoch;
  DELETE FROM public."session" WHERE "userId" = target_user;
  DELETE FROM public.mirror_password_flow WHERE user_id = target_user;
  INSERT INTO public.mirror_security_outbox(principal_id, epoch, kind)
    VALUES (p_id, next_epoch, event_kind);
  RETURN next_epoch;
END $$;
REVOKE ALL ON FUNCTION mirror_revoke_subject(text, text) FROM PUBLIC;
-- A row-lock read without granting the runtime role principal UPDATE privileges.
CREATE OR REPLACE FUNCTION mirror_lock_principal(target_principal text)
RETURNS TABLE(id text, disabled boolean, privileged boolean, epoch text)
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT p.id, p.disabled, p.privileged, p.authorization_epoch::text
  FROM public.mirror_principal p WHERE p.id=target_principal FOR SHARE;
$$;
REVOKE ALL ON FUNCTION mirror_lock_principal(text) FROM PUBLIC;
