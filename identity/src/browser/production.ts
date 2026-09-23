import { createAuthClient } from "better-auth/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { safeResumePath } from "../core/policy.js";

const auth = createAuthClient({ baseURL: location.origin, plugins: [passkeyClient()] });
const platform = "https://platform.mirrorprogress.com/api/auth/start?next=/admin";
const openPlatform = () => {
  if (location.origin === "https://accounts.mirrorprogress.com")
    location.assign(safeResumePath(new URLSearchParams(location.search).get("resume")) ?? platform);
};
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const storageKey = "mirror-identity-setup-invitation";
const hash = new URLSearchParams(location.hash.slice(1));
const invitationFromLink = hash.get("invitation");
const mailboxToken = hash.get("mailboxToken");
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
const node = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing ${id}`);
  return found as T;
};
const show = (value: string, failed = false) => {
  const target = node<HTMLElement>("message");
  target.textContent = value;
  target.classList.toggle("error", failed);
};
const userError = (error: unknown): string => {
  const code = error instanceof Error ? error.message : "unknown_error";
  if (code === "fresh_password_required" || code === "SESSION_NOT_FRESH") return "Your setup session expired. Sign in with your password again.";
  if (code === "session_required") return "Sign in with your password to continue.";
  if (code === "invalid_authentication") return "That email or password did not match. Please try again.";
  if (code === "privileged_passkey_required") return "Finish signing in with your passkey.";
  if (code === "AUTH_CANCELLED" || code === "ERROR_CEREMONY_ABORTED") return "The passkey prompt was cancelled. Try again when ready.";
  if (code === "passkey_unavailable") return "This browser could not start a passkey prompt. Try Chrome or Brave on a device with a screen lock.";
  if (/^passkey_[A-Z_0-9-]{1,80}$/.test(code)) return `Passkey could not be completed (${code.slice(8)}).`;
  return "The request failed. Please try again.";
};
async function api(path: string, body?: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(path, { method: body === undefined ? "GET" : "POST", credentials: "same-origin",
    headers: body === undefined ? {} : { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "request_failed");
  return result;
}
let passkeyRegistered = false;
async function refresh(): Promise<Record<string, unknown> | null> {
  try {
    const state = await api("/api/identity/session");
    passkeyRegistered = state.passkeyRegistered === true;
    node<HTMLElement>("passkey-step").hidden = false;
    node<HTMLElement>("session-status").textContent = state.mfaCompleted === true ? "You’re signed in." :
      passkeyRegistered ? "Your passkey is ready. Approve the prompt to sign in." : "Your account is ready. Set up your passkey to finish signing in.";
    if (state.mfaCompleted === true) {
      openPlatform();
    }
    return state;
  } catch {
    node<HTMLElement>("passkey-step").hidden = true;
    node<HTMLElement>("session-status").textContent = "Sign in with your password to continue.";
    return null;
  }
}
function passkeyError(error: { code?: string; message?: string } | null | undefined): Error {
  const code = error?.code;
  return new Error(code && /^[A-Z_0-9-]{1,80}$/.test(code) ? `passkey_${code}` : "passkey_unavailable");
}
async function finishPasskey(): Promise<void> {
  const step = node<HTMLElement>("passkey-step");
  step.hidden = false;
  step.scrollIntoView({ behavior: "smooth", block: "center" });
  if (!passkeyRegistered) {
    show("Approve the first device prompt to create your passkey.");
    const registered = await auth.passkey.addPasskey({ name: "Mirror Progress device" });
    if (registered.error) throw passkeyError(registered.error);
    passkeyRegistered = true;
  }
  show("Approve the passkey prompt to finish signing in.");
  const signedIn = await auth.signIn.passkey();
  if (signedIn.error) {
    node<HTMLElement>("passkey-signin").hidden = false;
    throw passkeyError(signedIn.error);
  }
  const state = await api("/api/identity/session");
  if (state.mfaCompleted !== true) throw new Error("privileged_passkey_required");
  show("Signed in. Opening Mirror Progress…");
  openPlatform();
}
function submit(id: string, action: (values: Record<string, string>) => Promise<void>) {
  node<HTMLFormElement>(id).addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value)]));
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    button.disabled = true;
    void action(values).catch(error => show(userError(error), true)).finally(() => {
      form.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach(input => { input.value = ""; });
      button.disabled = false;
    });
  });
}
submit("login", async values => {
  const result = await api("/api/auth/sign-in/email", { email: values.email, password: values.password });
  if (result.twoFactorRedirect === true) throw new Error("passkey_unavailable");
  const state = await refresh();
  if (!state) throw new Error("session_required");
  await finishPasskey();
});
node<HTMLButtonElement>("passkey-register").addEventListener("click", () => {
  const button = node<HTMLButtonElement>("passkey-register"); button.disabled = true;
  void finishPasskey().catch(error => show(userError(error), true)).finally(() => { button.disabled = false; });
});
node<HTMLButtonElement>("passkey-signin").addEventListener("click", () => {
  void finishPasskey().catch(error => show(userError(error), true));
});
let invitation = invitationFromLink;
try {
  if (invitation && tokenPattern.test(invitation)) localStorage.setItem(storageKey, JSON.stringify({ token: invitation, expiresAt: Date.now() + 900_000 }));
  else {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { token?: unknown; expiresAt?: unknown } | null;
    invitation = saved && typeof saved.token === "string" && tokenPattern.test(saved.token) && typeof saved.expiresAt === "number" && saved.expiresAt > Date.now() ? saved.token : null;
    if (!invitation) localStorage.removeItem(storageKey);
  }
} catch { /* The original tab still works if storage is disabled. */ }
if (invitation && tokenPattern.test(invitation)) {
  for (const id of ["mailbox", "enroll"]) (node<HTMLFormElement>(id).elements.namedItem("invitation") as HTMLInputElement).value = invitation;
}
if (mailboxToken && tokenPattern.test(mailboxToken)) {
  (node<HTMLFormElement>("enroll").elements.namedItem("mailboxToken") as HTMLInputElement).value = mailboxToken;
  show("Email verified. Choose a password to create your account.");
}
if (invitationFromLink || mailboxToken) node<HTMLDetailsElement>("setup-details").open = true;
submit("mailbox", async values => { await api("/api/identity/request-mailbox", { invitation: values.invitation });
  (node<HTMLFormElement>("enroll").elements.namedItem("invitation") as HTMLInputElement).value = values.invitation ?? "";
  show("Check your email for the verification link, then open it in this browser."); });
submit("enroll", async values => { await api("/api/identity/enroll", values);
  try { localStorage.removeItem(storageKey); } catch {}
  node<HTMLDetailsElement>("setup-details").open = false;
  show("Account created. Sign in with your email and password above; your device will handle the passkey prompts.");
  node<HTMLElement>("signin-step").scrollIntoView({ behavior: "smooth", block: "center" }); });
node<HTMLButtonElement>("signout").addEventListener("click", () => { void api("/api/auth/sign-out", {}).then(() => location.reload()).catch(error => show(userError(error), true)); });
node<HTMLButtonElement>("global-logout").addEventListener("click", () => { void api("/api/identity/global-logout", {}).then(() => location.reload()).catch(error => show(userError(error), true)); });
void refresh();
