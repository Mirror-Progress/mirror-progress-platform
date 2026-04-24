import type { Db } from 'mongodb';
import { hashPassword } from './auth-crypto';
import { allowDevSeedAccounts, getBootstrapAdmin, shouldBootstrapDemoData } from './app-runtime';
import { getDb } from './mongodb';
import { createSeedPlatformData, seedCreatedAt, seededAccountDefinitions } from './seed-data';
import type {
  ActionItemRecord,
  ActivityLogRecord,
  ClientRecord,
  DecisionRecord,
  MilestoneRecord,
  ProjectRecord,
  ResourceRecord,
} from './workspace-data';

let bootstrapPromise: Promise<void> | null = null;

function usersCollection(db: Db) {
  return db.collection('users');
}

function clientsCollection(db: Db) {
  return db.collection<ClientRecord & { _id: string }>('clients');
}

function projectsCollection(db: Db) {
  return db.collection<ProjectRecord & { _id: string }>('projects');
}

function milestonesCollection(db: Db) {
  return db.collection<MilestoneRecord & { _id: string }>('milestones');
}

function decisionsCollection(db: Db) {
  return db.collection<DecisionRecord & { _id: string }>('decisions');
}

function actionItemsCollection(db: Db) {
  return db.collection<ActionItemRecord & { _id: string }>('action_items');
}

function resourcesCollection(db: Db) {
  return db.collection<ResourceRecord & { _id: string }>('resource_links');
}

function activityCollection(db: Db) {
  return db.collection<ActivityLogRecord & { _id: string }>('activity_logs');
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    usersCollection(db).createIndex({ emailLower: 1 }, { unique: true }),
    projectsCollection(db).createIndex({ clientId: 1 }),
    milestonesCollection(db).createIndex({ projectId: 1 }),
    decisionsCollection(db).createIndex({ projectId: 1 }),
    actionItemsCollection(db).createIndex({ projectId: 1 }),
    resourcesCollection(db).createIndex({ projectId: 1 }),
    db.collection('password_resets').createIndex({ expiresAt: 1 }),
    db.collection('workspace_views').createIndex(
      { userId: 1, projectId: 1 },
      { unique: true }
    ),
    activityCollection(db).createIndex({ createdAt: -1 }),
  ]);
}

async function ensureBootstrapAdmin(db: Db) {
  const bootstrapAdmin = getBootstrapAdmin();

  if (!bootstrapAdmin) {
    return;
  }

  await usersCollection(db).updateOne(
    { emailLower: bootstrapAdmin.email.toLowerCase() },
    {
      $setOnInsert: {
        _id: 'user-bootstrap-super-admin',
        id: 'user-bootstrap-super-admin',
        name: bootstrapAdmin.name,
        email: bootstrapAdmin.email,
        emailLower: bootstrapAdmin.email.toLowerCase(),
        company: bootstrapAdmin.company,
        passwordHash: hashPassword(bootstrapAdmin.password),
        createdAt: new Date().toISOString(),
        role: 'super_admin',
        status: 'active',
        clientId: null,
        assignedProjectIds: [],
        inviteStatus: 'accepted',
        lastLoginAt: null,
      },
    },
    { upsert: true }
  );
}

async function ensureSeedAccounts(db: Db) {
  if (!allowDevSeedAccounts()) {
    return;
  }

  await Promise.all(
    seededAccountDefinitions.map((definition) =>
      usersCollection(db).updateOne(
        { emailLower: definition.email.toLowerCase() },
        {
          $setOnInsert: {
            _id: definition.id,
            id: definition.id,
            name: definition.name,
            email: definition.email,
            emailLower: definition.email.toLowerCase(),
            company: definition.company,
            passwordHash: hashPassword(definition.password),
            createdAt: seedCreatedAt,
            role: definition.role,
            status: definition.status,
            clientId: definition.clientId,
            assignedProjectIds: definition.assignedProjectIds,
            inviteStatus: definition.inviteStatus,
            lastLoginAt: null,
          },
        },
        { upsert: true }
      )
    )
  );
}

async function ensurePlatformSeedData(db: Db) {
  if (!shouldBootstrapDemoData()) {
    return;
  }

  const collectionNames = [
    'clients',
    'projects',
    'milestones',
    'decisions',
    'action_items',
    'resource_links',
    'activity_logs',
  ] as const;

  const counts = await Promise.all(
    collectionNames.map((name) => db.collection(name).countDocuments())
  );

  if (counts.some((count) => count > 0)) {
    return;
  }

  const seed = createSeedPlatformData();

  await Promise.all([
    clientsCollection(db).insertMany(
      seed.clients.map((item) => ({ _id: item.id, ...item }))
    ),
    projectsCollection(db).insertMany(
      seed.projects.map((item) => ({ _id: item.id, ...item }))
    ),
    milestonesCollection(db).insertMany(
      seed.milestones.map((item) => ({ _id: item.id, ...item }))
    ),
    decisionsCollection(db).insertMany(
      seed.decisions.map((item) => ({ _id: item.id, ...item }))
    ),
    actionItemsCollection(db).insertMany(
      seed.actionItems.map((item) => ({ _id: item.id, ...item }))
    ),
    resourcesCollection(db).insertMany(
      seed.resources.map((item) => ({ _id: item.id, ...item }))
    ),
    activityCollection(db).insertMany(
      seed.activity.map((item) => ({ _id: item.id, ...item }))
    ),
  ]);
}

async function performBootstrap() {
  const db = await getDb();
  await ensureIndexes(db);
  await ensureBootstrapAdmin(db);
  await ensureSeedAccounts(db);
  await ensurePlatformSeedData(db);

  const userCount = await usersCollection(db).countDocuments();

  if (userCount === 0) {
    throw new Error(
      'MongoDB is connected, but no users exist. Configure BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD or enable dev seed accounts.'
    );
  }
}

export async function ensureMongoBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = performBootstrap().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}
