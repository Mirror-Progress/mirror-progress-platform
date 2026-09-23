import { Stack, CfnOutput, RemovalPolicy, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { IdentityFoundation } from './foundation.js';
export interface StagingApplicationConfig {
  account: string; region: string; executionRoleArn: string;
  listenerArn: string; targetGroupArn: string; wildcardCertificateArn: string;
  loadBalancerDns: string; loadBalancerZone: string; hostedZoneId: string;
}
/** Only additive staging routing and scoped launch-time secrets. Does not change the existing ECS service. */
export class IdentityApplicationIntegration extends Stack {
  constructor(scope: Construct, id: string, config: StagingApplicationConfig, foundation: IdentityFoundation, props: StackProps = {}) {
    if (config.account !== foundation.account || config.region !== foundation.region ||
        !config.executionRoleArn.startsWith(`arn:aws:iam::${config.account}:role/MirrorProgressSecuritySta-PlatformTaskExecutionRole-`) ||
        !config.listenerArn.startsWith(`arn:aws:elasticloadbalancing:${config.region}:${config.account}:listener/app/`) ||
        !config.targetGroupArn.startsWith(`arn:aws:elasticloadbalancing:${config.region}:${config.account}:targetgroup/`) ||
        !config.wildcardCertificateArn.startsWith(`arn:aws:acm:${config.region}:${config.account}:certificate/`) ||
        !config.loadBalancerDns.endsWith(`.${config.region}.elb.amazonaws.com`) ||
        !/^Z[A-Z0-9]+$/.test(config.loadBalancerZone) || !/^Z[A-Z0-9]+$/.test(config.hostedZoneId) ||
        (props.env && (props.env.account !== config.account || props.env.region !== config.region))) throw new Error('invalid_staging_application_config');
    super(scope, id, { ...props, env: { account: config.account, region: config.region } });
    const key = kms.Key.fromKeyArn(this, 'SecretKey', foundation.secretsKey.keyArn);
    const seed = new secrets.Secret(this, 'FlowSeed', { encryptionKey: key, removalPolicy: RemovalPolicy.RETAIN,
      description: 'Staging browser authorization flow key seed, separate from session/status credentials',
      generateSecretString: { passwordLength: 64, excludePunctuation: true } });
    const execution = iam.Role.fromRoleArn(this, 'ExistingStagingExecutionRole', config.executionRoleArn, { mutable: true });
    const status = secrets.Secret.fromSecretCompleteArn(this, 'Status', foundation.statusSecret.secretArn);
    // The existing staging application execution role receives only these two new secrets.
    execution.addToPrincipalPolicy(new iam.PolicyStatement({ actions: ['secretsmanager:GetSecretValue'],
      resources: [seed.secretArn, status.secretArn], conditions: { Bool: { 'aws:SecureTransport': 'true' } } }));
    execution.addToPrincipalPolicy(new iam.PolicyStatement({ actions: ['kms:Decrypt'], resources: [key.keyArn],
      conditions: { StringEquals: { 'kms:ViaService': `secretsmanager.${config.region}.amazonaws.com` }, Bool: { 'aws:SecureTransport': 'true' } } }));
    const images = ecr.Repository.fromRepositoryAttributes(this, 'Images', { repositoryArn: foundation.repository.repositoryArn,
      repositoryName: foundation.repository.repositoryName });
    images.grantPull(execution);
    new elb.CfnListenerCertificate(this, 'StagingCertificate', { listenerArn: config.listenerArn,
      certificates: [{ certificateArn: config.wildcardCertificateArn }] });
    new elb.CfnListenerRule(this, 'StagingRoute', { listenerArn: config.listenerArn, priority: 401,
      conditions: [{ field: 'host-header', hostHeaderConfig: { values: ['staging.mirrorprogress.com'] } }],
      actions: [{ type: 'forward', targetGroupArn: config.targetGroupArn }] });
    new route53.CfnRecordSet(this, 'StagingDns', { hostedZoneId: config.hostedZoneId, name: 'staging.mirrorprogress.com', type: 'A',
      aliasTarget: { dnsName: config.loadBalancerDns, hostedZoneId: config.loadBalancerZone, evaluateTargetHealth: true } });
    new CfnOutput(this, 'FlowSeedArn', { value: seed.secretArn });
    new CfnOutput(this, 'SessionStatusSecretArn', { value: status.secretArn });
  }
}
