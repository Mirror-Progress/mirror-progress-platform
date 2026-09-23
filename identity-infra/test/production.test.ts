import test from 'node:test';
import assert from 'node:assert/strict';
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ProductionIdentityFoundation, validateProductionFoundationConfig } from '../src/production-foundation.js';
import { ProductionIdentityService, type ProductionServiceConfig } from '../src/production-service.js';
import { ProductionApplicationIntegration } from '../src/production-application.js';
const config: ProductionServiceConfig = { stage: 'production', account: '111111111111', region: 'us-east-1',
 vpcId: 'vpc-0123456789abcdef0', availabilityZones: ['us-east-1a','us-east-1b'],
 privateSubnetIds: ['subnet-0123456789abcdef0','subnet-0123456789abcdef1'],
 isolatedSubnetIds: ['subnet-0123456789abcdef2','subnet-0123456789abcdef3'],
 publicSubnetIds: ['subnet-0123456789abcdef4','subnet-0123456789abcdef5'],
 publicSubnetCidrs: ['10.0.0.0/24','10.0.1.0/24'], postgresVersion: '17.11', hostedZoneId: 'ZTEST1234',
 imageDigest: 'sha256:'+'a'.repeat(64), desiredCount: 0 };
test('production synthesis isolates durable state, remains stopped and never changes existing app routing', () => {
 const app = new App(), foundation = new ProductionIdentityFoundation(app,'ProductionFoundation',config);
 const service = new ProductionIdentityService(app,'ProductionService',config,foundation);
 const integration = new ProductionApplicationIntegration(app,'ProductionApplication',
  'arn:aws:iam::111111111111:role/MirrorProgressPlatform-PlatformTaskExecutionRole-synthetic',foundation);
 const f=Template.fromStack(foundation), s=Template.fromStack(service), a=Template.fromStack(integration);
 f.hasResourceProperties('AWS::RDS::DBInstance',{DBName:'mirror_identity_production',MasterUsername:'mirror_identity_production_owner',PubliclyAccessible:false,MultiAZ:true,BackupRetentionPeriod:35,DeletionProtection:true});
 f.hasResourceProperties('AWS::ECR::Repository',{RepositoryName:'mirror-identity-production',ImageTagMutability:'IMMUTABLE'});
 f.hasResource('AWS::RDS::DBInstance',{DeletionPolicy:'Retain',UpdateReplacePolicy:'Retain'});
 s.hasResourceProperties('AWS::ECS::Service',{DesiredCount:0,EnableExecuteCommand:false});
 s.hasResourceProperties('AWS::CertificateManager::Certificate',{DomainName:'accounts.mirrorprogress.com'});
 for(const {Properties:p} of Object.values(s.findResources('AWS::ECS::TaskDefinition')) as any[]){
  const c=p.ContainerDefinitions[0];assert.equal(c.User,'1000:1000');assert.equal(c.ReadonlyRootFilesystem,true);
  const env=Object.fromEntries(c.Environment.map((e:any)=>[e.Name,e.Value]));
  assert.equal(env.IDENTITY_MODE,'production');assert.equal(env.IDENTITY_REDIRECT_URIS,'["https://platform.mirrorprogress.com/api/auth/callback"]');
  assert.equal(c.Secrets.some((v:any)=>v.Name==='IDENTITY_OWNER_CREDENTIALS'),c.Name==='Migration');
  assert(c.Command[1].includes('production')); assert(!JSON.stringify(c).includes('accounts.staging'));
 }
 for(const type of ['AWS::ECS::Service','AWS::Route53::RecordSet','AWS::ElasticLoadBalancingV2::ListenerRule','AWS::Cognito::UserPool'])a.resourceCountIs(type,0);
 const policies=Object.values(a.findResources('AWS::IAM::Policy')) as any[];
 const reads=policies.flatMap(p=>p.Properties.PolicyDocument.Statement).filter(s=>s.Action==='secretsmanager:GetSecretValue');
 assert.equal(reads.length,1);assert.equal(reads[0].Resource.length,2);assert(!JSON.stringify(reads).includes('Owner'));
 assert.equal(app.synth().stacks.length,3);
});
test('production rejects invalid scale, staging config and the staging app role',()=>{
 assert.throws(()=>validateProductionFoundationConfig({...config,stage:'staging'} as any));
 const app=new App(), f=new ProductionIdentityFoundation(app,'Foundation',config);
 assert.throws(()=>new ProductionIdentityService(app,'Service',{...config,desiredCount:3} as any,f));
 assert.throws(()=>new ProductionApplicationIntegration(app,'App','arn:aws:iam::111111111111:role/MirrorProgressSecuritySta-PlatformTaskExecutionRole-synthetic',f));
});
