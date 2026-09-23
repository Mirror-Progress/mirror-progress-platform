import { createAuthClient } from "better-auth/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { safeResumePath } from "../core/policy.js";

const auth = createAuthClient({ baseURL: location.origin, plugins: [passkeyClient()] });
let platform = "https://platform.mirrorprogress.com/api/auth/start?next=/admin";
const manageRequested = location.hash === "#manage";
const openPlatform = () => {
  if (location.origin === "https://accounts.mirrorprogress.com" && !manageRequested)
    location.assign(safeResumePath(new URLSearchParams(location.search).get("resume")) ?? platform);
};
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const storageKey = "mirror-identity-setup-invitation";
const hash = new URLSearchParams(location.hash.slice(1));
const invitationFromLink = hash.get("invitation");
const mailboxToken = hash.get("mailboxToken");
const directManagedInvite = Boolean(invitationFromLink && !mailboxToken);
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
  if (code === "company_unavailable") return "Choose an existing company with active Prospect access and an available seat.";
  if (code === "external_email_delivery_unavailable") return "Invites to this email domain are temporarily unavailable. Contact your admin to use a verified Mirror Progress address.";
  if (code === "invitation_conflict") return "That email already has an invitation. Check the list below.";
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
async function loadInvitations(): Promise<void> {
  try {
    const result = await api("/api/identity/admin/invitations");
    node<HTMLElement>("manage-invitations").hidden = false;
    const panel = node<HTMLElement>("invitation-admin");
    panel.hidden = !manageRequested;
    if (!manageRequested) return;
    node<HTMLElement>("external-delivery-status").textContent = result.externalDeliveryReady === true
      ? "Invitations can be delivered to external email domains."
      : "External email delivery is pending. Mirror Progress addresses can be invited now.";
    const list = node<HTMLElement>("invitation-list");
    list.replaceChildren();
    const invitations = Array.isArray(result.invitations) ? result.invitations as Array<Record<string, unknown>> : [];
    for (const item of invitations) {
      const row = document.createElement("div");
      const status = item.accepted === true ? "Accepted" : item.revokedAt ? "Revoked" :
        new Date(String(item.expiresAt)).getTime() <= Date.now() ? "Expired" :
        item.deliveryStatus === "sent" ? "Sent" : item.deliveryStatus === "failed" ? "Delivery failed" : "Sending";
      const label = document.createElement("p");
      label.textContent = `${String(item.name)} · ${String(item.email)} · ${String(item.company)} · ${status}`;
      row.append(label);
      const id = String(item.principalId);
      if (/^[a-f0-9-]{36}$/.test(id) && !item.revokedAt) {
        if (item.accepted !== true) {
          const resend = document.createElement("button");
          resend.type = "button"; resend.className = "secondary"; resend.textContent = "Resend";
          resend.addEventListener("click", () => { resend.disabled = true;
            void api(`/api/identity/admin/invitations/${id}/resend`, {}).then(async () => {
              show("A new invitation link is queued."); await loadInvitations();
            }).catch(error => show(userError(error), true)).finally(() => { resend.disabled = false; }); });
          row.append(resend);
        }
        const revoke = document.createElement("button");
        revoke.type = "button"; revoke.className = "secondary"; revoke.textContent = "Revoke";
        revoke.addEventListener("click", () => { revoke.disabled = true;
          void api(`/api/identity/admin/invitations/${id}/revoke`, {}).then(async () => {
            show("Invitation and account access revoked."); await loadInvitations();
          }).catch(error => show(userError(error), true)).finally(() => { revoke.disabled = false; }); });
        row.append(revoke);
      }
      list.append(row);
    }
    if (!invitations.length) list.textContent = "No invitations yet.";
  } catch { node<HTMLElement>("invitation-admin").hidden = true; }
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
      node<HTMLElement>("auth-steps").hidden = true;
      node<HTMLElement>("setup-details").hidden = true;
      if (state.accountType === "external") platform = "https://platform.mirrorprogress.com/api/auth/start?next=/apps/studioiq";
      void loadInvitations();
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
  node<HTMLElement>("auth-steps").hidden = true;
  node<HTMLElement>("setup-details").hidden = true;
  if (state.accountType === "external") platform = "https://platform.mirrorprogress.com/api/auth/start?next=/apps/studioiq";
  show(manageRequested ? "Signed in. You can manage invitations below." : "Signed in. Opening Mirror Progress…");
  await loadInvitations();
  openPlatform();
}
async function signInAndFinish(email: string, password: string): Promise<void> {
  const result = await api("/api/auth/sign-in/email", { email, password });
  if (result.twoFactorRedirect === true) throw new Error("passkey_unavailable");
  const state = await refresh();
  if (!state) throw new Error("session_required");
  await finishPasskey();
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
  await signInAndFinish(values.email ?? "", values.password ?? "");
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
if (directManagedInvite && invitationFromLink && tokenPattern.test(invitationFromLink)) {
  (node<HTMLFormElement>("enroll").elements.namedItem("mailboxToken") as HTMLInputElement).value = invitationFromLink;
  for (const id of ["mailbox", "mailbox-guide", "invitation-label", "mailbox-label"]) node<HTMLElement>(id).hidden = true;
  show("You’re invited to Prospect. Choose a password to create your account.");
  void api("/api/identity/invitation-info", { invitation: invitationFromLink }).then(info => {
    (node<HTMLFormElement>("enroll").elements.namedItem("name") as HTMLInputElement).value = String(info.name ?? "");
    node<HTMLElement>("setup-intro").textContent = `You’re joining ${String(info.company ?? "Prospect")}. Create your account below.`;
  }).catch(() => show("This invitation has expired or was already used. Ask your admin for a new link.", true));
}
if (mailboxToken && tokenPattern.test(mailboxToken)) {
  (node<HTMLFormElement>("enroll").elements.namedItem("mailboxToken") as HTMLInputElement).value = mailboxToken;
  show("Email verified. Choose a password to create your account.");
}
if (invitationFromLink || mailboxToken) node<HTMLDetailsElement>("setup-details").open = true;
submit("mailbox", async values => { await api("/api/identity/request-mailbox", { invitation: values.invitation });
  (node<HTMLFormElement>("enroll").elements.namedItem("invitation") as HTMLInputElement).value = values.invitation ?? "";
  show("Check your email for the verification link, then open it in this browser."); });
submit("enroll", async values => { const enrolled = await api("/api/identity/enroll", values);
  try { localStorage.removeItem(storageKey); } catch {}
  node<HTMLDetailsElement>("setup-details").open = false;
  const email = String(enrolled.email ?? "");
  (node<HTMLFormElement>("login").elements.namedItem("email") as HTMLInputElement).value = email;
  if (!directManagedInvite) {
    show("Account created. Sign in with your email and password above; your device will handle the passkey prompts.");
    node<HTMLElement>("signin-step").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  show("Account created. Approve the device prompts to finish signing in.");
  try { await signInAndFinish(email, values.password ?? ""); }
  catch (error) {
    node<HTMLElement>("signin-step").scrollIntoView({ behavior: "smooth", block: "center" });
    show(`Account created. ${userError(error)} You can sign in above to retry.`, true);
  }
});
const inviteForm = node<HTMLFormElement>("invite-person");
const accountType = inviteForm.elements.namedItem("accountType") as HTMLSelectElement;
const role = inviteForm.elements.namedItem("role") as HTMLSelectElement;
const company = inviteForm.elements.namedItem("company") as HTMLInputElement;
accountType.addEventListener("change", () => {
  role.value = accountType.value === "external" ? "client" : "admin";
  if (accountType.value === "admin") company.value = "Mirror Progress";
  else if (company.value === "Mirror Progress") company.value = "";
  for (const option of [...role.options]) option.hidden = accountType.value === "external" ? option.value !== "client" : option.value === "client";
});
accountType.dispatchEvent(new Event("change"));
submit("invite-person", async values => {
  await api("/api/identity/admin/invitations", values);
  show("Invitation queued. Its delivery status appears below.");
  inviteForm.reset(); accountType.dispatchEvent(new Event("change"));
  await loadInvitations();
});
node<HTMLButtonElement>("signout").addEventListener("click", () => { void api("/api/auth/sign-out", {}).then(() => location.reload()).catch(error => show(userError(error), true)); });
node<HTMLButtonElement>("global-logout").addEventListener("click", () => { void api("/api/identity/global-logout", {}).then(() => location.reload()).catch(error => show(userError(error), true)); });
void refresh();
