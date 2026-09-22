/** Narrow library discovery metadata to the intentionally exposed batch-1 profile.
 * Identity/signature/issuer fields still come from the maintained provider. */
export function localOidcMetadata(source: Record<string, unknown>): Record<string, unknown> {
  const data = { ...source };
  for (const key of ["userinfo_endpoint", "end_session_endpoint", "revocation_endpoint",
    "introspection_endpoint", "registration_endpoint", "device_authorization_endpoint",
    "pushed_authorization_request_endpoint"]) delete data[key];
  data.grant_types_supported = ["authorization_code"];
  data.response_types_supported = ["code"];
  data.response_modes_supported = ["query"];
  data.code_challenge_methods_supported = ["S256"];
  data.token_endpoint_auth_methods_supported = ["none"];
  data.claims_parameter_supported = false;
  data.prompt_values_supported = [];
  return data;
}
