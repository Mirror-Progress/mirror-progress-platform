import { fileURLToPath } from 'node:url';
import { App } from 'aws-cdk-lib';
import { IdentityFoundation } from './foundation.js';
import { IdentityApplicationIntegration } from './application.js';
import { IdentityService, type ServiceConfig } from './service.js';
// Verified inventory, not credentials. Never import the original platform stack.
const config: ServiceConfig = {
  stage: 'staging', account: '380314682150', region: 'us-east-1', vpcId: 'vpc-05d4779e3d841ca2d',
  availabilityZones: ['us-east-1a', 'us-east-1b'],
  privateSubnetIds: ['subnet-0b47d0854d81d2142', 'subnet-0bf3cad7147dce01b'],
  isolatedSubnetIds: ['subnet-02b1377a7fd9ed705', 'subnet-054a4ac95c78dd159'],
  publicSubnetIds: ['subnet-0f500f037def53793', 'subnet-09542b160134e4415'],
  publicSubnetCidrs: ['10.0.0.0/24', '10.0.1.0/24'], hostedZoneId: 'Z0789473A6S6HO6JIQO1',
  postgresVersion: '17.11', imageDigest: process.env.IDENTITY_IMAGE_DIGEST ?? '', desiredCount: process.argv.includes('--start-service') ? 1 : 0,
};
if (process.argv.includes('--start-service') && !process.argv.includes('--service')) throw new Error('service_required');
const app = new App({ outdir: fileURLToPath(new URL('../../cdk.out-staging', import.meta.url)) });
const foundation = new IdentityFoundation(app, 'MirrorIdentityStagingFoundation', config);
if (process.argv.includes('--service')) new IdentityService(app, 'MirrorIdentityStagingService', config, foundation);
if (process.argv.includes('--application')) new IdentityApplicationIntegration(app, 'MirrorIdentityStagingApplication', {
  account: config.account, region: config.region, hostedZoneId: config.hostedZoneId,
  executionRoleArn: 'arn:aws:iam::380314682150:role/MirrorProgressSecuritySta-PlatformTaskExecutionRole-bbqbAFybHc1r',
  listenerArn: 'arn:aws:elasticloadbalancing:us-east-1:380314682150:listener/app/Mirror-LoadB-jyydx8tRjkUV/3eae072a2fdf6162/b6b6d28a76ffa1e8',
  targetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:380314682150:targetgroup/Mirror-Platf-1OXXZEBGN1WK/6b902e43fbf503fc',
  wildcardCertificateArn: 'arn:aws:acm:us-east-1:380314682150:certificate/09965471-c727-42e4-9a31-b378c2d3dda8',
  loadBalancerDns: 'Mirror-LoadB-jyydx8tRjkUV-1189634444.us-east-1.elb.amazonaws.com', loadBalancerZone: 'Z35SXDOTRQ7X7K',
}, foundation);
const assembly = app.synth();
for (const stack of assembly.stacks) console.log(`${stack.stackName}: ${assembly.directory}/${stack.templateFile}`);
