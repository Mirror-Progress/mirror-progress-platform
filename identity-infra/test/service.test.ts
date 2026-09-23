import test from 'node:test';
import assert from 'node:assert/strict';
import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { IdentityFoundation } from '../src/foundation.js';
import { IdentityService, type ServiceConfig } from '../src/service.js';
const config: ServiceConfig = { stage: 'staging', account: '111111111111', region: 'us-east-1', vpcId: 'vpc-0123456789abcdef0',
  privateSubnetIds: ['subnet-0123456789abcdef0', 'subnet-0123456789abcdef1'],
  isolatedSubnetIds: ['subnet-0123456789abcdef2', 'subnet-0123456789abcdef3'],
  publicSubnetIds: ['subnet-0123456789abcdef4', 'subnet-0123456789abcdef5'], publicSubnetCidrs: ['10.0.0.0/24', '10.0.1.0/24'],
  availabilityZones: ['us-east-1a', 'us-east-1b'], postgresVersion: '17.6', hostedZoneId: 'ZTEST1234',
  imageDigest: 'sha256:' + 'a'.repeat(64), desiredCount: 0 };
test('staging service is private, digest pinned, initially stopped, with explicit migration separation', () => {
  const app = new App(), foundation = new IdentityFoundation(app, 'Foundation', config);
  const stack = new IdentityService(app, 'Service', config, foundation), t = Template.fromStack(stack);
  t.hasResourceProperties('AWS::ECS::Service', { DesiredCount: 0, EnableExecuteCommand: false,
    DeploymentConfiguration: Match.objectLike({ DeploymentCircuitBreaker: { Enable: true, Rollback: true }, MinimumHealthyPercent: 100 }),
    NetworkConfiguration: { AwsvpcConfiguration: Match.objectLike({ AssignPublicIp: 'DISABLED', Subnets: config.privateSubnetIds }) } });
  t.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', { Port: 3040, Protocol: 'HTTPS', HealthCheckPort: '3041',
    HealthCheckPath: '/health/ready', HealthCheckProtocol: 'HTTP' });
  t.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', { Port: 443, Protocol: 'HTTPS',
    DefaultActions: [{ Type: 'fixed-response', FixedResponseConfig: { StatusCode: '404' } }] });
  t.hasResourceProperties('AWS::CertificateManager::Certificate', { DomainName: 'accounts.staging.mirrorprogress.com', ValidationMethod: 'DNS' });
  t.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1); t.resourceCountIs('AWS::Cognito::UserPool', 0);
  const defs = Object.values(t.findResources('AWS::ECS::TaskDefinition')) as any[];
  assert.equal(defs.length, 2);
  for (const { Properties: p } of defs) {
    assert.equal(p.NetworkMode, 'awsvpc'); assert.equal(p.RuntimePlatform.CpuArchitecture, 'ARM64');
    const c = p.ContainerDefinitions[0]; assert.equal(c.ReadonlyRootFilesystem, true); assert.equal(c.User, '1000:1000');
    assert.deepEqual(c.LinuxParameters.Capabilities.Drop, ['ALL']);
    assert.ok(JSON.stringify(c.Image).includes(config.imageDigest));
    const names = c.Secrets.map((s: any) => s.Name);
    assert.equal(names.includes('IDENTITY_OWNER_CREDENTIALS'), c.Name === 'Migration');
    assert.equal(c.Environment.some((e: any) => /PASSWORD|SECRET|CREDENTIAL/.test(e.Name)), false);
  }
  // Synthesizing both stacks catches cross-stack dependency cycles as well as template assertions.
  assert.equal(app.synth().stacks.length, 2);
});
test('service rejects mutable images and overlapping public subnets', () => {
  for (const delta of [{ imageDigest: 'latest' }, { desiredCount: 2 }, { publicSubnetIds: config.privateSubnetIds },
    { publicSubnetCidrs: ['0.0.0.0/0', '10.0.1.0/24'] }]) {
    const app = new App(), foundation = new IdentityFoundation(app, 'Foundation', config);
    assert.throws(() => new IdentityService(app, 'Service', { ...config, ...delta } as ServiceConfig, foundation));
  }
});
