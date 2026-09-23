import { mkdir, chmod } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { productionContainerEnvironment } from "../src/core/container-config.js";
try {
  const env = productionContainerEnvironment(process.env);
  await mkdir("/run/identity", { recursive: true, mode: 0o700 });
  await chmod("/run/identity", 0o700);
  const cert = spawnSync("openssl", ["req", "-x509", "-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:P-256", "-nodes",
    "-days", "7", "-subj", "/CN=accounts.mirrorprogress.com", "-keyout", env.IDENTITY_TLS_KEY_FILE!,
    "-out", env.IDENTITY_TLS_CERT_FILE!], { stdio: "ignore", timeout: 10_000, env: { PATH: "/usr/bin:/bin" } });
  if (cert.status !== 0) throw new Error("backend_certificate_failed");
  await chmod(env.IDENTITY_TLS_KEY_FILE!, 0o600);
  // ALB supplies the browser certificate. This ephemeral backend key never leaves the task.
  delete process.env.IDENTITY_RUNTIME_CREDENTIALS; delete process.env.IDENTITY_DELIVERY_SEED;
  Object.assign(process.env, env);
  await import("../src/server.js");
} catch { console.error("Identity production startup failed; inspect configuration without logging secrets."); process.exitCode = 1; }
