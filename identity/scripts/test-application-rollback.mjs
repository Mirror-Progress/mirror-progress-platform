// Local route-switch rehearsal. No provider requests, AWS access or application database writes.
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const image = process.env.IDENTITY_TEST_APP_IMAGE ?? 'mirror-platform:identity-cutover-candidate';
const execute = (args, env = process.env) => execFileSync('docker', args, { env, encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] });
for (const mode of ['mirror', 'cognito']) {
  const name = `identity-app-rollback-${randomBytes(4).toString('hex')}`;
  const env = { ...process.env, AUTH_IDENTITY_PROVIDER: mode, SITE_SURFACE: 'platform', APP_PROTECTED_MODE: 'false', STATE_AUTHORIZATION_MODE: 'authoritative', STATE_IDENTITY_PROVIDER: 'cognito',
    BOOTSTRAP_DEMO_DATA: 'false', ALLOW_DEV_SEED_ACCOUNTS: 'false', ALLOW_PUBLIC_SIGNUP: 'false', ALLOW_PASSWORD_RESET: 'false',
    SESSION_SECRET: randomBytes(48).toString('hex'), AUTH_SESSION_SECRET: randomBytes(48).toString('hex'),
    COGNITO_USER_POOL_ID: 'us-east-1_SYNTHETIC', COGNITO_CLIENT_ID: 'synthetic-client', COGNITO_DOMAIN: 'https://synthetic.auth.example.invalid',
    COGNITO_REDIRECT_URI: 'https://staging.mirrorprogress.com/api/auth/cognito/callback' };
  const names = Object.keys(env).filter(k => ['AUTH_IDENTITY_PROVIDER','SITE_SURFACE','APP_PROTECTED_MODE','STATE_AUTHORIZATION_MODE','STATE_IDENTITY_PROVIDER','BOOTSTRAP_DEMO_DATA','ALLOW_DEV_SEED_ACCOUNTS','ALLOW_PUBLIC_SIGNUP','ALLOW_PASSWORD_RESET','SESSION_SECRET','AUTH_SESSION_SECRET','COGNITO_USER_POOL_ID','COGNITO_CLIENT_ID','COGNITO_DOMAIN','COGNITO_REDIRECT_URI'].includes(k));
  try {
    execute(['run', '-d', '--rm', '--name', name, '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
      '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m', ...names.flatMap(k => ['-e', k]), image], env);
    const code = `const origin='http://127.0.0.1:3000';const mode=${JSON.stringify(mode)};
      const get=p=>fetch(origin+p,{redirect:'manual'});
      if((await get('/api/health')).status!==200)throw new Error('health');
      const response=await get('/api/auth/cognito/start?next=/apps/studioiq');if(response.status!==302)throw new Error('start_'+response.status+'_'+response.headers.get('location'));
      const location=response.headers.get('location');
      if(mode==='mirror'){
        if(location!=='/api/auth/start?next=%2Fapps%2Fstudioiq')throw new Error('mirror_redirect');
        if((await get('/api/auth/cognito/callback?code=synthetic')).status!==404)throw new Error('legacy_callback');
      }else{
        const url=new URL(location);if(url.origin!=='https://synthetic.auth.example.invalid'||url.pathname!=='/oauth2/authorize'||url.searchParams.get('code_challenge_method')!=='S256')throw new Error('cognito_pkce');
        if((await get('/api/auth/start')).status!==404)throw new Error('mirror_start');
      }
      console.log(mode+' route-switch checks passed');`;
    let ready = false, lastProbeError;
    for (let i = 0; i < 20; i++) {
      try { console.log(execute(['exec', name, 'node', '--input-type=module', '-e', code]).trim()); ready = true; break; }
      catch (error) { lastProbeError = error; await new Promise(r => setTimeout(r, 500)); }
    }
    if (!ready) {
      console.error(String(lastProbeError?.stderr ?? '').slice(0, 1800));
      console.error(execute(['logs', name]).slice(-1800));
      throw new Error('local_route_switch_failed');
    }
  } finally { try { execute(['rm', '-f', name]); } catch {} }
}
