import { Stack, Duration, RemovalPolicy, CfnOutput, Tags, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface FoundationConfig {
  stage: 'staging'; account: string; region: string; vpcId: string;
  availabilityZones: [string, string]; privateSubnetIds: [string, string];
  /** Pin a minor supported in the target region, verified before deployment. */
  postgresVersion: string;
}
export function validateFoundationConfig(config: FoundationConfig) {
  if (config.stage !== 'staging' || !/^\d{12}$/.test(config.account) || !/^[a-z]{2}-[a-z]+-\d$/.test(config.region) ||
      !/^vpc-[a-f0-9]{8,17}$/.test(config.vpcId) || !/^17\.\d{1,2}$/.test(config.postgresVersion) ||
      config.privateSubnetIds.length !== 2 || new Set(config.privateSubnetIds).size !== 2 ||
      config.privateSubnetIds.some(id => !/^subnet-[a-f0-9]{8,17}$/.test(id)) ||
      config.availabilityZones.length !== 2 || new Set(config.availabilityZones).size !== 2 ||
      config.availabilityZones.some(zone => !new RegExp(`^${config.region}[a-z]$`).test(zone))) throw new Error('invalid_staging_foundation_config');
}

/** Additive independent stateful foundation. No service, DNS, Cognito, email or cutover. */
export class IdentityFoundation extends Stack {
  readonly database: rds.DatabaseInstance;
  readonly runtimeGroup: ec2.SecurityGroup;
  readonly operatorGroup: ec2.SecurityGroup;
  readonly repository: ecr.Repository;
  readonly runtimeCredentials: secrets.Secret;
  readonly authSecret: secrets.Secret;
  readonly statusSecret: secrets.Secret;
  readonly deliverySeed: secrets.Secret;
  readonly serviceLogs: logs.LogGroup;
  constructor(scope: Construct, id: string, config: FoundationConfig, props: StackProps = {}) {
    validateFoundationConfig(config);
    if (props.env && (props.env.account !== config.account || props.env.region !== config.region)) throw new Error('environment_mismatch');
    super(scope, id, { ...props, env: { account: config.account, region: config.region }, terminationProtection: true });
    Tags.of(this).add('Application', 'MirrorIdentity'); Tags.of(this).add('Environment', 'staging');
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'ExistingNetwork', { vpcId: config.vpcId,
      availabilityZones: config.availabilityZones, privateSubnetIds: config.privateSubnetIds });
    const dataKey = new kms.Key(this, 'DatabaseKey', { enableKeyRotation: true, removalPolicy: RemovalPolicy.RETAIN });
    const secretsKey = new kms.Key(this, 'SecretsKey', { enableKeyRotation: true, removalPolicy: RemovalPolicy.RETAIN });
    const imageKey = new kms.Key(this, 'ImagesKey', { enableKeyRotation: true, removalPolicy: RemovalPolicy.RETAIN });
    this.repository = new ecr.Repository(this, 'ServiceImages', { repositoryName: 'mirror-identity-staging',
      encryption: ecr.RepositoryEncryption.KMS, encryptionKey: imageKey,
      imageTagMutability: ecr.TagMutability.IMMUTABLE, imageScanOnPush: true, removalPolicy: RemovalPolicy.RETAIN,
      emptyOnDelete: false });
    this.runtimeGroup = new ec2.SecurityGroup(this, 'RuntimeNetwork', { vpc, allowAllOutbound: false,
      description: 'Identity only; no public IP or database owner access' });
    this.operatorGroup = new ec2.SecurityGroup(this, 'OperatorNetwork', { vpc, allowAllOutbound: false,
      description: 'One-off reviewed database migration tasks only' });
    const databaseGroup = new ec2.SecurityGroup(this, 'DatabaseNetwork', { vpc, allowAllOutbound: false });
    databaseGroup.addIngressRule(this.runtimeGroup, ec2.Port.tcp(5432), 'Application runtime SQL only');
    databaseGroup.addIngressRule(this.operatorGroup, ec2.Port.tcp(5432), 'Explicit one-off database administration');
    this.runtimeGroup.addEgressRule(databaseGroup, ec2.Port.tcp(5432));
    this.operatorGroup.addEgressRule(databaseGroup, ec2.Port.tcp(5432));
    // Existing private subnet NAT/endpoints and CloudTrail must be verified before any deployment.
    this.runtimeGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'AWS private endpoints or verified NAT');
    this.operatorGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Secrets and logs through verified private egress');
    const engine = rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.of(config.postgresVersion, '17') });
    const parameters = new rds.ParameterGroup(this, 'PostgresParameters', { engine, parameters: {
      'rds.force_ssl': '1', 'password_encryption': 'scram-sha-256',
      'log_statement': 'none', 'log_min_error_statement': 'panic',
    } });
    this.database = new rds.DatabaseInstance(this, 'Database', { vpc, vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      engine, parameterGroup: parameters, databaseName: 'mirror_identity_staging',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
      credentials: rds.Credentials.fromGeneratedSecret('mirror_identity_owner', { encryptionKey: secretsKey,
        secretName: 'mirror-identity/staging/database-owner' }),
      securityGroups: [databaseGroup], publiclyAccessible: false, multiAz: true, storageEncrypted: true, storageEncryptionKey: dataKey,
      storageType: rds.StorageType.GP3, allocatedStorage: 20, maxAllocatedStorage: 100,
      backupRetention: Duration.days(35), deleteAutomatedBackups: false, deletionProtection: true,
      removalPolicy: RemovalPolicy.RETAIN, autoMinorVersionUpgrade: false, allowMajorVersionUpgrade: false,
      copyTagsToSnapshot: true,
    });
    const secret = (name: string, description: string, template?: object) => new secrets.Secret(this, name, {
      encryptionKey: secretsKey, description, removalPolicy: RemovalPolicy.RETAIN,
      generateSecretString: { passwordLength: 64, excludePunctuation: true,
        ...(template ? { secretStringTemplate: JSON.stringify(template), generateStringKey: 'password' } : {}) },
    });
    this.runtimeCredentials = secret('RuntimeCredentials', 'Least-privilege staging SQL login; not the database owner',
      { username: 'mirror_identity_staging_runtime', dbname: 'mirror_identity_staging', engine: 'postgres', port: 5432 });
    this.authSecret = secret('AuthSecret', 'Better Auth cookie and credential encryption; coordinate rotation with session invalidation');
    this.statusSecret = secret('StatusSecret', 'Read-only app-to-Identity session status authentication; separate from user cookies');
    this.deliverySeed = secret('DeliverySeed', 'High-entropy seed for delivery encryption; derive 32-byte key with SHA-256 at runtime');
    this.serviceLogs = new logs.LogGroup(this, 'ServiceLogs', { encryptionKey: new kms.Key(this, 'LogsKey', {
      enableKeyRotation: true, removalPolicy: RemovalPolicy.RETAIN }), retention: logs.RetentionDays.THREE_MONTHS, removalPolicy: RemovalPolicy.RETAIN });
    new CfnOutput(this, 'DatabaseEndpoint', { value: this.database.dbInstanceEndpointAddress });
    new CfnOutput(this, 'OwnerSecretArn', { value: this.database.secret!.secretArn });
    new CfnOutput(this, 'RuntimeSecretArn', { value: this.runtimeCredentials.secretArn });
    new CfnOutput(this, 'ImageRepositoryUri', { value: this.repository.repositoryUri });
  }
}
