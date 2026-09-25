#!/usr/bin/env node
// Issue a small, explicit Prospect invitation batch through the production identity task.
// Usage: node identity/scripts/invite-people.mjs invitees.json [--check]
// The owner must have completed a passkey sign-in within the last five minutes.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const region = 'us-east-1';
const cluster = 'mirror-identity-production';
const source = process.argv[2];
const checkOnly = process.argv[3] === '--check';
if (!source || process.argv.length > 4 || (process.argv.length === 4 && !checkOnly)) {
  console.error('Usage: node identity/scripts/invite-people.mjs invitees.json [--check]');
  process.exit(2);
}
const people = JSON.parse(readFileSync(source, 'utf8'));
if (!Array.isArray(people) || people.length < 1 || people.length > 10) throw new Error('Expected 1–10 invitees');
const emails = new Set();
for (const person of people) {
  if (!person || Object.keys(person).sort().join(',') !== 'accountType,company,email,name,role' ||
      typeof person.name !== 'string' || !person.name.trim() || person.name.length > 120 ||
      typeof person.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email) ||
      typeof person.company !== 'string' || !person.company.trim() || person.company.length > 120 ||
      !((person.accountType === 'admin' && person.company === 'Mirror Progress' &&
          ['admin', 'project_lead'].includes(person.role)) ||
        (person.accountType === 'external' && person.role === 'client'))) throw new Error('Invalid invitee');
  person.email = person.email.toLowerCase();
  if (emails.has(person.email)) throw new Error('Duplicate invitee email');
  emails.add(person.email);
}
const aws = (...args) => JSON.parse(execFileSync('aws', [...args, '--region', region, '--output', 'json'],
  { encoding: 'utf8', maxBuffer: 1024 * 1024 }));
if (aws('sts', 'get-caller-identity').Account !== '380314682150') throw new Error('Wrong AWS account');
const serviceArns = aws('ecs', 'list-services', '--cluster', cluster).serviceArns;
const identityServiceArn = serviceArns.find(arn => arn.split('/').at(-1).startsWith('MirrorIdentityProductionService-'));
if (!identityServiceArn) throw new Error('Production identity service is unavailable');
const service = aws('ecs', 'describe-services', '--cluster', cluster, '--services', identityServiceArn).services?.[0];
if (!service || service.status !== 'ACTIVE' || !service.networkConfiguration?.awsvpcConfiguration) {
  throw new Error('Production identity service is unavailable');
}
const taskDef = aws('ecs', 'describe-task-definition', '--task-definition', service.taskDefinition).taskDefinition;
const container = taskDef.containerDefinitions.find(item => item.name === 'Identity');
if (!container) throw new Error('Identity container missing');
if (checkOnly) {
  console.log(JSON.stringify({ account: '380314682150',
    service: service.serviceName, recipients: people.map(({ email, role }) => ({ email, role })),
    externalEmailReady: aws('sesv2', 'get-account').ProductionAccessEnabled === true,
    action: 'validated only; no invitations sent' }, null, 2));
  process.exit(0);
}
// Keep invite links inside the sealed outbox. Logs contain only addresses and status.
const job = readFileSync(new URL('./invite-task.mjs', import.meta.url), 'utf8');
const input = {
  cluster, taskDefinition: service.taskDefinition, launchType: 'FARGATE', count: 1,
  networkConfiguration: service.networkConfiguration,
  overrides: { containerOverrides: [{ name: 'Identity', command: ['node', '--input-type=module', '-e', job],
    environment: [{ name: 'PROSPECT_INVITE_BATCH', value: Buffer.from(JSON.stringify(people)).toString('base64url') }] }] },
};
const directory = mkdtempSync(join(tmpdir(), 'prospect-invites-'));
try {
  const path = join(directory, 'task.json');
  writeFileSync(path, JSON.stringify(input), { mode: 0o600 });
  const result = aws('ecs', 'run-task', '--cli-input-json', `file://${path}`);
  if (result.failures?.length || result.tasks?.length !== 1) throw new Error(JSON.stringify(result.failures));
  const task = result.tasks[0];
  const arn = task.taskArn;
  console.log(`Invite task started: ${arn}`);
  execFileSync('aws', ['ecs', 'wait', 'tasks-stopped', '--cluster', cluster, '--tasks', arn, '--region', region], { stdio: 'inherit' });
  const stopped = aws('ecs', 'describe-tasks', '--cluster', cluster, '--tasks', arn).tasks[0];
  const logGroup = container.logConfiguration?.options?.['awslogs-group'];
  const streamPrefix = container.logConfiguration?.options?.['awslogs-stream-prefix'];
  if (logGroup && streamPrefix) {
    const stream = `${streamPrefix}/${container.name}/${arn.split('/').at(-1)}`;
    const events = aws('logs', 'get-log-events', '--log-group-name', logGroup, '--log-stream-name', stream).events;
    for (const event of events) console.log(event.message);
  }
  if (stopped.containers?.find(item => item.name === 'Identity')?.exitCode !== 0) process.exitCode = 1;
} finally { rmSync(directory, { recursive: true, force: true }); }
