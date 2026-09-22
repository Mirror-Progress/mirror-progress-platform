import { createAuthClient } from "better-auth/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { safeResumePath } from "../core/policy.js";
const authClient = createAuthClient({ baseURL: window.location.origin, plugins: [passkeyClient()] });
const element = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id); if (!node) throw new Error("Missing UI element"); return node as T;
};
const message = (text: string, failed = false) => { const node=element("message");node.textContent=text;node.classList.toggle("error",failed); };
async function api(path:string,body?:unknown):Promise<Record<string,unknown>> {
  const response=await fetch(path,{method:body===undefined?"GET":"POST",credentials:"same-origin",
    headers:body===undefined?{}:{"content-type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json() as Record<string,unknown>;
  if(!response.ok) throw new Error(typeof data.error==="string"?data.error:"Request failed");
  return data;
}
async function refresh(){
  const status=element("session-status"),link=element<HTMLAnchorElement>("resume");link.hidden=true;
  try{
    const session=await api("/api/identity/session");
    status.textContent=session.mfaCompleted===true?`MFA complete · principal ${String(session.principalId)}`:"Password/session present · completed MFA still required";
    const resume=safeResumePath(new URLSearchParams(location.search).get("resume"));
    if(session.mfaCompleted===true&&resume){link.href=resume;link.hidden=false;}
  }catch{status.textContent="No active verified session.";}
}
function form(id:string,fn:(values:Record<string,string>)=>Promise<void>){
  element<HTMLFormElement>(id).addEventListener("submit",event=>{
    event.preventDefault();const current=event.currentTarget as HTMLFormElement;
    const values=Object.fromEntries([...new FormData(current)].map(([k,v])=>[k,String(v)]));
    const submit=current.querySelector<HTMLButtonElement>('button[type="submit"]')!;submit.disabled=true;
    void fn(values).catch(error=>message(error instanceof Error?error.message:"Request failed",true)).finally(()=>{
      current.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach(input=>{input.value="";});submit.disabled=false;void refresh();
    });
  });
}
function button(id:string,fn:()=>Promise<void>){element(id).addEventListener("click",()=>{void fn().catch(error=>message(error instanceof Error?error.message:"Request failed",true)).finally(()=>{void refresh();});});}
form("login",async values=>{const result=await api("/api/auth/sign-in/email",{email:values.email,password:values.password});message(result.twoFactorRedirect===true?"Password verified. Enter your TOTP code.":"Password verified. Register a factor, then perform a fresh authentication.");});
form("enroll",async values=>{await api("/api/identity/enroll",values);message("Synthetic identity enrolled. Sign in with your password to register your first factor. Mailbox ownership is not verified in this laboratory.");});
form("totp-setup",async values=>{
  const data=await api("/api/auth/two-factor/enable",{password:values.password});
  const uri=typeof data.totpURI==="string"?data.totpURI:"";const codes=Array.isArray(data.backupCodes)?data.backupCodes:[];
  const secret=uri?new URL(uri).searchParams.get("secret"):"";
  const output=element("setup-material");output.textContent=`Authenticator secret (enter manually):\n${secret}\n\nFull otpauth URI:\n${uri}\n\nRecovery codes — store privately before clearing:\n${codes.join("\n")}`;
  output.hidden=false;element("clear-material").hidden=false;
  message("Enter a current authenticator code to confirm registration. Then sign out and complete a fresh password/TOTP login.");
});
form("verify",async values=>{const result=await api("/api/auth/two-factor/verify-totp",{code:values.code});message(result.mfaCompleted===true?"TOTP authentication complete.":"Registration confirmed only. Sign out, then sign in with password and TOTP.");});
form("recovery",async values=>{await api("/api/auth/two-factor/verify-backup-code",{code:values.code});message("Recovery code consumed. Identity sessions revoked. Assisted credential recovery and downstream invalidation delivery are not implemented.");});
button("passkey-register",async()=>{const result=await authClient.passkey.addPasskey({name:"Mirror local device"});if(result.error)throw new Error(result.error.message??"Passkey registration failed");message("Passkey registered. Now use ‘Authenticate with a passkey’ to prove possession and user verification.");});
button("passkey-signin",async()=>{const result=await authClient.signIn.passkey();if(result.error)throw new Error(result.error.message??"Passkey authentication failed");message("Passkey authentication completed with user verification.");});
button("signout",async()=>{await api("/api/auth/sign-out",{});message("Signed out of Identity.");});
button("global-logout",async()=>{await api("/api/identity/global-logout",{});message("Identity sessions revoked. A downstream invalidation event is queued but has not been delivered.");});
button("refresh",refresh);
button("clear-material",async()=>{element("setup-material").textContent="";element("setup-material").hidden=true;element("clear-material").hidden=true;message("Setup material cleared from the page.");});
void refresh();
