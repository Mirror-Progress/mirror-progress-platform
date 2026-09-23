import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from 'aws-cdk-lib';
import { ProductionIdentityFoundation } from './production-foundation.js';
import { ProductionIdentityService, type ProductionServiceConfig } from './production-service.js';
import { ProductionApplicationIntegration } from './production-application.js';
// Offline compiler only. Inventory and immutable image digest must be supplied explicitly.
// No AWS API calls, deployment, existing service update or user/account import.
if (process.argv.length !== 3) throw new Error('production_inventory_json_required');
const input = JSON.parse(readFileSync(resolve(process.argv[2]!), 'utf8')) as {
  infrastructure: ProductionServiceConfig; applicationExecutionRoleArn: string;
};
if (!input.infrastructure || input.infrastructure.stage !== 'production' || ![0, 1, 2].includes(input.infrastructure.desiredCount)) {
  throw new Error('production_inventory_required');
}
const app = new App({ outdir: fileURLToPath(new URL('../../cdk.out-production', import.meta.url)) });
const foundation = new ProductionIdentityFoundation(app, 'MirrorIdentityProductionFoundation', input.infrastructure);
new ProductionIdentityService(app, 'MirrorIdentityProductionService', input.infrastructure, foundation);
new ProductionApplicationIntegration(app, 'MirrorIdentityProductionApplication', input.applicationExecutionRoleArn, foundation);
for (const stack of app.synth().stacks) console.log(stack.stackName);
