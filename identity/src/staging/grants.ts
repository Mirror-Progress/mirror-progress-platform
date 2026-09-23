/** Fixed, reviewed v1.7.5 tables only. No grants on future plugin tables or role metadata. */
export const stagingGrants = `
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM mirror_identity_staging_runtime, mirror_identity_staging_operator;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM mirror_identity_staging_runtime, mirror_identity_staging_operator;
GRANT USAGE ON SCHEMA public TO mirror_identity_staging_runtime, mirror_identity_staging_operator;
GRANT SELECT,INSERT,UPDATE,DELETE ON "user","session","account","verification","twoFactor",passkey,jwks,
  "rateLimit","oauthRefreshToken","oauthAccessToken","oauthConsent",
  mirror_assurance,mirror_password_flow,mirror_totp_replay,mirror_rate_limit,
  mirror_staging_mailbox,mirror_staging_delivery TO mirror_identity_staging_runtime;
GRANT SELECT ON mirror_principal,mirror_binding,mirror_staging_reconciliation,mirror_staging_invitation,
  mirror_staging_enrollment,mirror_staging_approval,"oauthClient","oauthResource","oauthClientResource"
  TO mirror_identity_staging_runtime;
GRANT INSERT ON mirror_binding,mirror_staging_enrollment TO mirror_identity_staging_runtime;
GRANT UPDATE (consumed_at) ON mirror_staging_invitation TO mirror_identity_staging_runtime;
GRANT EXECUTE ON FUNCTION mirror_lock_principal(text),mirror_revoke_subject(text,text) TO mirror_identity_staging_runtime;
GRANT EXECUTE ON FUNCTION mirror_staging_reconcile(text,bigint,text,text),mirror_staging_issue(text,bigint,text,text),
  mirror_staging_approve(text,bigint,text),mirror_staging_request_recovery(text,text,bigint,text,text),
  mirror_staging_approve_recovery(text,text) TO mirror_identity_staging_operator;
`;

// Same immutable policy schema, with separate production login roles/database.
export const productionGrants = stagingGrants.replaceAll("mirror_identity_staging_runtime", "mirror_identity_production_runtime")
  .replaceAll("mirror_identity_staging_operator", "mirror_identity_production_operator");
