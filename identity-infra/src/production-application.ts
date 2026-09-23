import { Stack, CfnOutput, RemovalPolicy, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { ProductionIdentityFoundation } from './production-foundation.js';
// Launch-time permissions only: no existing application service, route, DNS or Cognito mutation.
export class ProductionApplicationIntegration extends Stack {
  constructor(scope: Construct, id: string, executionRoleArn: string, foundation: ProductionIdentityFoundation, props: StackProps = {}) {
    if (!executionRoleArn.startsWith(`arn:aws:iam::${foundation.account}:role/MirrorProgressPlatform-PlatformTaskExecutionRole`) ||
      (props.env && (props.env.account !== foundation.account || props.env.region !== foundation.region))) throw new Error('invalid_production_execution_role');
    super(scope, id, { ...props, env: { account: foundation.account, region: foundation.region } });
    const key = kms.Key.fromKeyArn(this, 'SecretKey', foundation.secretsKey.keyArn);
    const seed = new secrets.Secret(this, 'FlowSeed', { encryptionKey: key, removalPolicy: RemovalPolicy.RETAIN,
      description: 'Production browser authorization flow seed; separate from cookies and status credentials',
      generateSecretString: { passwordLength: 64, excludePunctuation: true } });
    const execution = iam.Role.fromRoleArn(this, 'ExistingProductionExecutionRole', executionRoleArn, { mutable: true });
    execution.addToPrincipalPolicy(new iam.PolicyStatement({ actions: ['secretsmanager:GetSecretValue'],
      resources: [seed.secretArn, foundation.statusSecret.secretArn], conditions: { Bool: { 'aws:SecureTransport': 'true' } } }));
    execution.addToPrincipalPolicy(new iam.PolicyStatement({ actions: ['kms:Decrypt'], resources: [key.keyArn],
      conditions: { StringEquals: { 'kms:ViaService': `secretsmanager.${foundation.region}.amazonaws.com` }, Bool: { 'aws:SecureTransport': 'true' } } }));
    ecr.Repository.fromRepositoryAttributes(this, 'Images', { repositoryArn: foundation.repository.repositoryArn,
      repositoryName: foundation.repository.repositoryName }).grantPull(execution);
    new CfnOutput(this, 'FlowSeedArn', { value: seed.secretArn });
    new CfnOutput(this, 'SessionStatusSecretArn', { value: foundation.statusSecret.secretArn });
  }
}
