import { fileURLToPath } from 'node:url';
import { App } from 'aws-cdk-lib';
import { IdentityFoundation } from './foundation.js';
import { IdentityService, type ServiceConfig } from './service.js';
// Verified inventory, not credentials. Never import the original platform stack.
const config: ServiceConfig = {
  stage: 'staging', account: '380314682150', region: 'us-east-1', vpcId: 'vpc-05d4779e3d841ca2d',
  availabilityZones: ['us-east-1a', 'us-east-1b'],
  privateSubnetIds: ['subnet-0b47d0854d81d2142', 'subnet-0bf3cad7147dce01b'],
  isolatedSubnetIds: ['subnet-02b1377a7fd9ed705', 'subnet-054a4ac95c78dd159'],
  publicSubnetIds: ['subnet-0f500f037def53793', 'subnet-09542b160134e4415'],
  publicSubnetCidrs: ['10.0.0.0/24', '10.0.1.0/24'], hostedZoneId: 'Z0789473A6S6HO6JIQO1',
  postgresVersion: '17.11', imageDigest: process.env.IDENTITY_IMAGE_DIGEST ?? '', desiredCount: 0,
};
const app = new App({ outdir: fileURLToPath(new URL('../../cdk.out-staging', import.meta.url)) });
const foundation = new IdentityFoundation(app, 'MirrorIdentityStagingFoundation', config);
if (process.argv.includes('--service')) new IdentityService(app, 'MirrorIdentityStagingService', config, foundation);
const assembly = app.synth();
for (const stack of assembly.stacks) console.log(`${stack.stackName}: ${assembly.directory}/${stack.templateFile}`);
