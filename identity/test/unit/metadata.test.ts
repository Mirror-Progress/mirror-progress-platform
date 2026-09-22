import test from "node:test";
import assert from "node:assert/strict";
import { localOidcMetadata } from "../../src/core/metadata.js";
test("discovery does not advertise blocked endpoints or authentication methods", () => {
  const result = localOidcMetadata({ issuer: "http://localhost:3040/api/auth", jwks_uri: "http://localhost:3040/api/auth/jwks",
    userinfo_endpoint: "blocked", registration_endpoint: "blocked", end_session_endpoint: "blocked", introspection_endpoint: "blocked" });
  assert.equal(result.issuer, "http://localhost:3040/api/auth");
  assert.equal(result.jwks_uri, "http://localhost:3040/api/auth/jwks");
  for (const name of ["userinfo_endpoint", "registration_endpoint", "end_session_endpoint", "introspection_endpoint"]) assert.equal(result[name], undefined);
  assert.deepEqual(result.grant_types_supported, ["authorization_code"]);
  assert.deepEqual(result.token_endpoint_auth_methods_supported, ["none"]);
  assert.deepEqual(result.code_challenge_methods_supported, ["S256"]);
  assert.equal(result.claims_parameter_supported, false);
});
test("discovery projection does not mutate the library metadata object", () => {
  const original={registration_endpoint:"original",issuer:"unchanged"};
  localOidcMetadata(original); assert.equal(original.registration_endpoint,"original");
});
