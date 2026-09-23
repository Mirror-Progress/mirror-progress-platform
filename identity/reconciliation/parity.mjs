// Pure aggregate-only comparison. Never return identifiers or account attributes.
export function reconcile(accounts, principals, memberships, heads) {
 const counts={accounts:accounts.length,principals:principals.length,matched:0,privileged:0};
 const failures={cognitoIneligible:0,missingPrincipal:0,ambiguousPrincipal:0,invalidPrincipal:0,unmatchedPrincipal:0,missingMembership:0,ambiguousMembership:0,invalidMembership:0,missingPolicy:0,ambiguousPolicy:0,invalidPolicy:0,orphanMembership:0};
 const text=v=>typeof v==='string'&&v.length>0;
 const scope=(a,b)=>a.tenantId===b.tenantId&&a.workspaceId===b.workspaceId;
 for(const a of accounts){
  if(!a.enabled||!a.confirmed||!a.verified||!text(a.subject))failures.cognitoIneligible++;
  const ps=principals.filter(p=>p.cognitoSubject===a.subject);
  if(!ps.length){failures.missingPrincipal++;continue;}
  if(ps.length!==1){failures.ambiguousPrincipal++;continue;}
  const p=ps[0];counts.matched++;
  if(!text(p.principalId)||!text(p.tenantId)||!text(p.workspaceId)||p.status!=='active'||!Number.isSafeInteger(p.authorizationEpoch)||p.authorizationEpoch<0||principals.filter(q=>q.principalId===p.principalId).length!==1)failures.invalidPrincipal++;
  const ms=memberships.filter(m=>m.principalId===p.principalId&&scope(m,p));
  if(!ms.length)failures.missingMembership++;
  else if(ms.length!==1)failures.ambiguousMembership++;
  else {const m=ms[0];if(m.status!=='active'||!text(m.membershipId)||!Array.isArray(m.roles)||!m.roles.length||m.roles.some(r=>!['super_admin','admin','project_lead','client'].includes(r)))failures.invalidMembership++;else if(m.roles.some(r=>r!=='client'))counts.privileged++;}
  const hs=heads.filter(h=>scope(h,p));
  if(!hs.length)failures.missingPolicy++;else if(hs.length!==1)failures.ambiguousPolicy++;
  else if(!text(hs[0].policyRevisionId)||!text(hs[0].policyId)||(hs[0].breakGlassExpiresAt&&(!Number.isFinite(Date.parse(hs[0].breakGlassExpiresAt))||Date.parse(hs[0].breakGlassExpiresAt)<=Date.now())))failures.invalidPolicy++;
 }
 failures.unmatchedPrincipal=principals.filter(p=>!accounts.some(a=>a.subject===p.cognitoSubject)).length;
 failures.orphanMembership=memberships.filter(m=>!principals.some(p=>p.principalId===m.principalId&&scope(m,p))).length;
 const details={principalInvited:principals.filter(p=>p.status==='invited').length,principalDisabled:principals.filter(p=>p.status==='disabled').length,principalUnknownStatus:principals.filter(p=>!['active','invited','disabled'].includes(p.status)).length,unsafeEpoch:principals.filter(p=>!Number.isSafeInteger(p.authorizationEpoch)||p.authorizationEpoch<0).length,missingPrincipalScope:principals.filter(p=>!text(p.principalId)||!text(p.tenantId)||!text(p.workspaceId)).length,membershipInvited:memberships.filter(m=>m.status==='invited').length,membershipDisabled:memberships.filter(m=>m.status==='disabled').length,membershipUnknownStatus:memberships.filter(m=>!['active','invited','disabled'].includes(m.status)).length,invalidRoles:memberships.filter(m=>!Array.isArray(m.roles)||!m.roles.length||m.roles.some(r=>!['super_admin','admin','project_lead','client'].includes(r))).length,missingMembershipId:memberships.filter(m=>!text(m.membershipId)).length};
 return {passed:Object.values(failures).every(n=>n===0),counts,failures,details};
}
