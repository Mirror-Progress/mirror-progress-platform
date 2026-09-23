import test from 'node:test';
import assert from 'node:assert/strict';
import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { IdentityFoundation, type FoundationConfig } from '../src/foundation.js';
import { IdentityApplicationIntegration } from '../src/application.js';
test('application integration adds only the staging hostname and limited secret launch permissions', () => {
  const app = new App(), config: FoundationConfig = { stage: 'staging', account: '111111111111', region: 'us-east-1', vpcId: 'vpc-0123456789abcdef0',
    privateSubnetIds: ['subnet-0123456789abcdef0','subnet-0123456789abcdef1'], isolatedSubnetIds: ['subnet-0123456789abcdef2','subnet-0123456789abcdef3'],
    availabilityZones: ['us-east-1a','us-east-1b'], postgresVersion: '17.6' };
  const foundation = new IdentityFoundation(app, 'Foundation', config);
  const integration = new IdentityApplicationIntegration(app, 'Application', { account: config.account, region: config.region,
    executionRoleArn: 'arn:aws:iam::111111111111:role/MirrorProgressSecuritySta-PlatformTaskExecutionRole-synthetic',
    listenerArn: 'arn:aws:elasticloadbalancing:us-east-1:111111111111:listener/app/synthetic/one/two',
    targetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:111111111111:targetgroup/synthetic/one',
    wildcardCertificateArn: 'arn:aws:acm:us-east-1:111111111111:certificate/synthetic',
    loadBalancerDns: 'synthetic.us-east-1.elb.amazonaws.com', loadBalancerZone: 'ZSYNTHETIC', hostedZoneId: 'ZSYNTHETIC' }, foundation);
  const template = Template.fromStack(integration);
  template.resourceCountIs('AWS::ECS::Service',0); template.resourceCountIs('AWS::Cognito::UserPool',0);
  template.hasResourceProperties('AWS::Route53::RecordSet',{Name:'staging.mirrorprogress.com',Type:'A'});
  template.hasResourceProperties('AWS::IAM::Policy',{PolicyDocument:Match.objectLike({Statement:Match.arrayWith([
    Match.objectLike({Action:'secretsmanager:GetSecretValue',Condition:{Bool:{'aws:SecureTransport':'true'}}}),
    Match.objectLike({Action:'kms:Decrypt',Condition:Match.objectLike({StringEquals:{'kms:ViaService':'secretsmanager.us-east-1.amazonaws.com'}})}),
  ])})});
  assert.equal(app.synth().stacks.length,2);
});
