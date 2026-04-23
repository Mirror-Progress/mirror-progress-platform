import path from 'path';
import { dataDir, ensureJsonFile, readJsonText, writeJsonFile } from './storage';

interface WorkspaceViewStore {
  views: Record<string, Record<string, string>>;
}

const workspaceViewsPath = path.join(dataDir, 'workspace-views.local.json');

async function ensureWorkspaceViewFile() {
  await ensureJsonFile(workspaceViewsPath, () => ({ views: {} }));
}

async function readWorkspaceViews(): Promise<WorkspaceViewStore> {
  await ensureWorkspaceViewFile();
  const raw = await readJsonText(workspaceViewsPath);

  try {
    return JSON.parse(raw) as WorkspaceViewStore;
  } catch {
    return { views: {} };
  }
}

async function writeWorkspaceViews(store: WorkspaceViewStore) {
  await ensureWorkspaceViewFile();
  await writeJsonFile(workspaceViewsPath, store);
}

export async function getWorkspaceView(userId: string, projectId: string) {
  const store = await readWorkspaceViews();
  return store.views[userId]?.[projectId] ?? null;
}

export async function listLatestWorkspaceViews() {
  const store = await readWorkspaceViews();

  return Object.entries(store.views).map(([userId, projectViews]) => {
    const latestViewedAt = Object.values(projectViews).sort().at(-1) ?? null;

    return {
      userId,
      latestViewedAt,
      projectViews,
    };
  });
}

export async function recordWorkspaceView(input: {
  userId: string;
  projectId: string;
}) {
  const store = await readWorkspaceViews();
  const currentViews = store.views[input.userId] ?? {};
  const previousViewedAt = currentViews[input.projectId] ?? null;

  store.views[input.userId] = {
    ...currentViews,
    [input.projectId]: new Date().toISOString(),
  };

  await writeWorkspaceViews(store);

  return previousViewedAt;
}
