import { Stack, Duration, CfnOutput, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as waf from 'aws-cdk-lib/aws-wafv2';
import { IdentityFoundation, validateFoundationConfig, type FoundationConfig } from './foundation.js';
export interface ServiceConfig extends FoundationConfig {
  publicSubnetIds: [string, string]; publicSubnetCidrs: [string, string];
  hostedZoneId: string; imageDigest: string; desiredCount: 0 | 1;
}
const hostname = 'accounts.staging.mirrorprogress.com';
/** Additive staging service only. Initial desiredCount=0 permits the explicit migration task first. */
export class IdentityService extends Stack {
  readonly migration: ecs.FargateTaskDefinition;
  readonly service: ecs.FargateService;
  constructor(scope: Construct, id: string, config: ServiceConfig, foundation: IdentityFoundation, props: StackProps = {}) {
    validateFoundationConfig(config);
    if (!/^sha256:[a-f0-9]{64}$/.test(config.imageDigest) || !/^Z[A-Z0-9]+$/.test(config.hostedZoneId) ||
        ![0, 1].includes(config.desiredCount) || config.publicSubnetIds.length !== 2 || new Set(config.publicSubnetIds).size !== 2 ||
        config.publicSubnetIds.some(s => !/^subnet-[a-f0-9]{8,17}$/.test(s) || [...config.privateSubnetIds, ...config.isolatedSubnetIds].includes(s)) ||
        config.publicSubnetCidrs.length !== 2 || new Set(config.publicSubnetCidrs).size !== 2 ||
        config.publicSubnetCidrs.some(c => !/^10\.\d{1,3}\.\d{1,3}\.0\/24$/.test(c) || c.split('/')[0]!.split('.').some(n => Number(n) > 255))) throw new Error('invalid_staging_service_config');
    if (foundation.account !== config.account || foundation.region !== config.region ||
        (props.env && (props.env.account !== config.account || props.env.region !== config.region))) throw new Error('environment_mismatch');
    super(scope, id, { ...props, env: { account: config.account, region: config.region } });
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'Network', { vpcId: config.vpcId, availabilityZones: config.availabilityZones,
      privateSubnetIds: config.privateSubnetIds, publicSubnetIds: config.publicSubnetIds });
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc, clusterName: 'mirror-identity-staging', containerInsightsV2: ecs.ContainerInsights.ENABLED });
    const repository = ecr.Repository.fromRepositoryAttributes(this, 'Images', { repositoryArn: foundation.repository.repositoryArn, repositoryName: foundation.repository.repositoryName });
    const image = ecs.ContainerImage.fromEcrRepository(repository, config.imageDigest);
    // Import secret handles without keys: grants belong to these execution roles, never back-reference this stack in foundation key policies.
    const injected = (name: string, secret: sm.ISecret) => ecs.Secret.fromSecretsManager(sm.Secret.fromSecretCompleteArn(this, name, secret.secretArn));
    const environment = {
      IDENTITY_MODE: 'staging', IDENTITY_TRANSPORT: 'alb', IDENTITY_BIND_HOST: '0.0.0.0',
      IDENTITY_ORIGIN: `https://${hostname}`, IDENTITY_RP_ID: hostname,
      IDENTITY_OIDC_CLIENT_ID: 'mirror-staging', IDENTITY_REDIRECT_URIS: '["https://staging.mirrorprogress.com/api/auth/callback"]',
      IDENTITY_ALB_SUBNET_CIDRS: config.publicSubnetCidrs.join(','), IDENTITY_DATABASE_HOST: foundation.database.dbInstanceEndpointAddress,
    };
    const secrets = { IDENTITY_RUNTIME_CREDENTIALS: injected('RuntimeSecret', foundation.runtimeCredentials),
      BETTER_AUTH_SECRET: injected('AuthSecret', foundation.authSecret),
      IDENTITY_SESSION_STATUS_SECRET: injected('StatusSecret', foundation.statusSecret),
      IDENTITY_DELIVERY_SEED: injected('DeliverySeed', foundation.deliverySeed) };
    const definition = (name: string) => new ecs.FargateTaskDefinition(this, name, { cpu: 512, memoryLimitMiB: 1024,
      runtimePlatform: { operatingSystemFamily: ecs.OperatingSystemFamily.LINUX, cpuArchitecture: ecs.CpuArchitecture.ARM64 } });
    const task = definition('RuntimeTask'); task.addVolume({ name: 'ephemeral-tls' });
    const container = task.addContainer('Identity', { image, user: '1000:1000', readonlyRootFilesystem: true,
      command: ['node', 'dist/scripts/start-container.js'], environment, secrets,
      logging: ecs.LogDrivers.awsLogs({ logGroup: foundation.serviceLogs, streamPrefix: 'runtime', mode: ecs.AwsLogDriverMode.BLOCKING }),
      stopTimeout: Duration.seconds(30), linuxParameters: new ecs.LinuxParameters(this, 'RuntimeLinux', { initProcessEnabled: true }),
      portMappings: [{ containerPort: 3040 }, { containerPort: 3041 }] });
    container.addMountPoints({ sourceVolume: 'ephemeral-tls', containerPath: '/run/identity', readOnly: false });
    container.linuxParameters!.dropCapabilities(ecs.Capability.ALL);
    this.migration = definition('MigrationTask');
    const migration = this.migration.addContainer('Migration', { image, user: '1000:1000', readonlyRootFilesystem: true,
      command: ['node', 'dist/scripts/migrate-container.js'], environment,
      secrets: { ...secrets, IDENTITY_OWNER_CREDENTIALS: injected('OwnerSecret', foundation.database.secret!) },
      logging: ecs.LogDrivers.awsLogs({ logGroup: foundation.serviceLogs, streamPrefix: 'migration', mode: ecs.AwsLogDriverMode.BLOCKING }),
      linuxParameters: new ecs.LinuxParameters(this, 'MigrationLinux', { initProcessEnabled: true }) });
    migration.linuxParameters!.dropCapabilities(ecs.Capability.ALL);
    for (const definition of [task, this.migration]) definition.obtainExecutionRole().addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['kms:Decrypt'], resources: [foundation.secretsKey.keyArn],
      conditions: { StringEquals: { 'kms:ViaService': `secretsmanager.${config.region}.amazonaws.com` } },
    }));
    this.service = new ecs.FargateService(this, 'Service', { cluster, taskDefinition: task, desiredCount: config.desiredCount,
      assignPublicIp: false, vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }, securityGroups: [foundation.runtimeGroup],
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4, enableExecuteCommand: false, circuitBreaker: { rollback: true },
      minHealthyPercent: 100, maxHealthyPercent: 200, healthCheckGracePeriod: Duration.seconds(60) });
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', { hostedZoneId: config.hostedZoneId, zoneName: 'mirrorprogress.com' });
    const certificate = new acm.Certificate(this, 'Certificate', { domainName: hostname, validation: acm.CertificateValidation.fromDns(zone) });
    const alb = new elb.ApplicationLoadBalancer(this, 'Ingress', { vpc, internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }, securityGroup: foundation.edgeGroup,
      dropInvalidHeaderFields: true, preserveHostHeader: true, idleTimeout: Duration.seconds(30) });
    alb.setAttribute('routing.http.xff_header_processing.mode', 'append');
    alb.setAttribute('routing.http.xff_client_port.enabled', 'false');
    const listener = alb.addListener('Https', { port: 443, certificates: [certificate], open: false,
      sslPolicy: elb.SslPolicy.TLS13_RES, defaultAction: elb.ListenerAction.fixedResponse(404) });
    listener.addTargets('Identity', { priority: 1, conditions: [elb.ListenerCondition.hostHeaders([hostname])],
      port: 3040, protocol: elb.ApplicationProtocol.HTTPS, targets: [this.service],
      deregistrationDelay: Duration.seconds(30), healthCheck: { port: '3041', protocol: elb.Protocol.HTTP,
        path: '/health/ready', healthyHttpCodes: '200', timeout: Duration.seconds(5), interval: Duration.seconds(15) } });
    const acl = new waf.CfnWebACL(this, 'EdgeRateLimit', { scope: 'REGIONAL', defaultAction: { allow: {} },
      visibilityConfig: { cloudWatchMetricsEnabled: true, metricName: 'MirrorIdentityStaging', sampledRequestsEnabled: false },
      rules: [{ name: 'BoundedRequestsPerIP', priority: 0, action: { block: {} },
        statement: { rateBasedStatement: { limit: 1000, aggregateKeyType: 'IP', evaluationWindowSec: 300 } },
        visibilityConfig: { cloudWatchMetricsEnabled: true, metricName: 'IdentityRateLimit', sampledRequestsEnabled: false } }] });
    new waf.CfnWebACLAssociation(this, 'WafBinding', { resourceArn: alb.loadBalancerArn, webAclArn: acl.attrArn });
    new route53.ARecord(this, 'AccountsDns', { zone, recordName: hostname, target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb)) });
    new CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
    new CfnOutput(this, 'ServiceName', { value: this.service.serviceName });
    new CfnOutput(this, 'MigrationTaskArn', { value: this.migration.taskDefinitionArn });
    new CfnOutput(this, 'OperatorSecurityGroup', { value: foundation.operatorGroup.securityGroupId });
  }
}
