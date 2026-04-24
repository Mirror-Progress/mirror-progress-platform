import { ensureMongoBootstrap } from './mongodb-bootstrap';
import { getDb } from './mongodb';

interface WorkspaceViewDocument {
  _id: string;
  userId: string;
  projectId: string;
  viewedAt: string;
}

function workspaceViewsCollection() {
  return getDb().then((db) =>
    db.collection<WorkspaceViewDocument>('workspace_views')
  );
}

export async function getWorkspaceView(userId: string, projectId: string) {
  await ensureMongoBootstrap();
  const collection = await workspaceViewsCollection();
  const record = await collection.findOne({
    _id: `${userId}:${projectId}`,
  });

  return record?.viewedAt ?? null;
}

export async function listLatestWorkspaceViews() {
  await ensureMongoBootstrap();
  const collection = await workspaceViewsCollection();
  const records = await collection.find({}).sort({ viewedAt: -1 }).toArray();
  const grouped = new Map<string, Record<string, string>>();

  records.forEach((record) => {
    const existing = grouped.get(record.userId) ?? {};
    existing[record.projectId] = record.viewedAt;
    grouped.set(record.userId, existing);
  });

  return [...grouped.entries()].map(([userId, projectViews]) => ({
    userId,
    latestViewedAt: Object.values(projectViews).sort().at(-1) ?? null,
    projectViews,
  }));
}

export async function recordWorkspaceView(input: {
  userId: string;
  projectId: string;
}) {
  await ensureMongoBootstrap();
  const collection = await workspaceViewsCollection();
  const currentRecord = await collection.findOne({
    _id: `${input.userId}:${input.projectId}`,
  });

  await collection.updateOne(
    { _id: `${input.userId}:${input.projectId}` },
    {
      $set: {
        userId: input.userId,
        projectId: input.projectId,
        viewedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  return currentRecord?.viewedAt ?? null;
}
