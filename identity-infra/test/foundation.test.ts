import test from 'node:test';
import assert from 'node:assert/strict';
import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { IdentityFoundation, validateFoundationConfig, type FoundationConfig } from '../src/foundation.js';
const config: FoundationConfig = { stage: 'staging', account: '111111111111', region: 'us-east-1', vpcId: 'vpc-0123456789abcdef0',
  privateSubnetIds: ['subnet-0123456789abcdef0', 'subnet-0123456789abcdef1'], isolatedSubnetIds: ['subnet-0123456789abcdef2', 'subnet-0123456789abcdef3'], availabilityZones: ['us-east-1a', 'us-east-1b'], postgresVersion: '17.6' };
test('offline synthesis retains private encrypted Multi-AZ PostgreSQL and immutable images', () => {
  const stack = new IdentityFoundation(new App(), 'MirrorIdentityStagingFoundationTest', config), template = Template.fromStack(stack);
  assert.equal(stack.terminationProtection, true);
  template.hasResourceProperties('AWS::RDS::DBSubnetGroup', { SubnetIds: config.isolatedSubnetIds });
  template.hasResourceProperties('AWS::RDS::DBInstance', { Engine: 'postgres', EngineVersion: '17.6', PubliclyAccessible: false,
    MultiAZ: true, StorageEncrypted: true, DeletionProtection: true, BackupRetentionPeriod: 35, AutoMinorVersionUpgrade: false });
  template.hasResource('AWS::RDS::DBInstance', { DeletionPolicy: 'Retain', UpdateReplacePolicy: 'Retain' });
  template.hasResourceProperties('AWS::ECR::Repository', { ImageTagMutability: 'IMMUTABLE',
    ImageScanningConfiguration: { ScanOnPush: true }, EncryptionConfiguration: { EncryptionType: 'KMS', KmsKey: Match.anyValue() } });
  template.hasResourceProperties('AWS::RDS::DBParameterGroup', { Parameters: { 'rds.force_ssl': '1',
    password_encryption: 'scram-sha-256', log_statement: 'none', log_min_error_statement: 'panic' } });
  template.hasResourceProperties('AWS::KMS::Key', { KeyPolicy: Match.objectLike({ Statement: Match.arrayWith([Match.objectLike({
    Principal: { Service: 'logs.us-east-1.amazonaws.com' },
    Condition: { ArnLike: { 'kms:EncryptionContext:aws:logs:arn': 'arn:aws:logs:us-east-1:111111111111:log-group:MirrorIdentityStagingFoundationTest-ServiceLogs*' } },
  })]) }) });
  template.resourceCountIs('AWS::Cognito::UserPool', 0); template.resourceCountIs('AWS::ECS::Service', 0);
  template.resourceCountIs('AWS::Route53::RecordSet', 0); template.resourceCountIs('AWS::IAM::AccessKey', 0);
  const json = template.toJSON();
  for (const resource of Object.values(json.Resources) as { Type: string; Properties: Record<string, unknown> }[]) {
    if (resource.Type === 'AWS::KMS::Key') assert.equal(resource.Properties.EnableKeyRotation, true);
    if (resource.Type === 'AWS::SecretsManager::Secret') {
      assert.equal((resource as any).DeletionPolicy, 'Retain'); assert.ok(resource.Properties.KmsKeyId); assert.equal(resource.Properties.SecretString, undefined);
    }
    if (resource.Type === 'AWS::EC2::SecurityGroupIngress' && resource.Properties.CidrIp) {
      assert.equal(resource.Properties.CidrIp, '0.0.0.0/0'); assert.equal(resource.Properties.FromPort, 443);
      assert.equal(resource.Properties.ToPort, 443);
    }
  }
});
test('configuration cannot select production, mixed regions, duplicate subnets or another stack environment', () => {
  for (const delta of [{ stage: 'production' }, { privateSubnetIds: [config.privateSubnetIds[0], config.privateSubnetIds[0]] },
    { isolatedSubnetIds: ['subnet-0123456789abcdef2', 'subnet-0123456789abcdef3'], availabilityZones: ['us-east-1a', 'us-west-2a'] }, { postgresVersion: 'latest' }, { account: '123' }]) {
    assert.throws(() => validateFoundationConfig({ ...config, ...delta } as FoundationConfig));
  }
  assert.throws(() => new IdentityFoundation(new App(), 'WrongEnvironment', config, { env: { account: '222222222222', region: 'us-east-1' } }));
});
