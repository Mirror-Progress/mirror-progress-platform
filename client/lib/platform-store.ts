import crypto from 'crypto';
import { ensureMongoBootstrap } from './mongodb-bootstrap';
import { getDb } from './mongodb';
import type {
  ActionItemRecord,
  ActivityLogRecord,
  ClientRecord,
  DecisionRecord,
  MilestoneRecord,
  PlatformDataRecord,
  ProjectRecord,
  ResourceRecord,
} from './workspace-data';

interface ClientDocument extends ClientRecord {
  _id: string;
}

interface ProjectDocument extends ProjectRecord {
  _id: string;
}

interface MilestoneDocument extends MilestoneRecord {
  _id: string;
}

interface DecisionDocument extends DecisionRecord {
  _id: string;
}

interface ActionItemDocument extends ActionItemRecord {
  _id: string;
}

interface ResourceDocument extends ResourceRecord {
  _id: string;
}

interface ActivityDocument extends ActivityLogRecord {
  _id: string;
}

function stripMongoId<T extends { _id: string }>(document: T) {
  const { _id, ...rest } = document;
  return rest;
}

async function collections() {
  const db = await getDb();

  return {
    clients: db.collection<ClientDocument>('clients'),
    projects: db.collection<ProjectDocument>('projects'),
    milestones: db.collection<MilestoneDocument>('milestones'),
    decisions: db.collection<DecisionDocument>('decisions'),
    actionItems: db.collection<ActionItemDocument>('action_items'),
    resources: db.collection<ResourceDocument>('resource_links'),
    activity: db.collection<ActivityDocument>('activity_logs'),
  };
}

export async function readPlatformData(): Promise<PlatformDataRecord> {
  await ensureMongoBootstrap();
  const store = await collections();
  const [clients, projects, milestones, decisions, actionItems, resources, activity] =
    await Promise.all([
      store.clients.find({}).sort({ companyName: 1 }).toArray(),
      store.projects.find({}).sort({ lastUpdated: -1 }).toArray(),
      store.milestones.find({}).sort({ date: -1 }).toArray(),
      store.decisions.find({}).sort({ date: -1 }).toArray(),
      store.actionItems.find({}).sort({ dueDate: 1 }).toArray(),
      store.resources.find({}).sort({ addedAt: -1 }).toArray(),
      store.activity.find({}).sort({ createdAt: -1 }).toArray(),
    ]);

  return {
    clients: clients.map(stripMongoId),
    projects: projects.map(stripMongoId),
    milestones: milestones.map(stripMongoId),
    decisions: decisions.map(stripMongoId),
    actionItems: actionItems.map(stripMongoId),
    resources: resources.map(stripMongoId),
    activity: activity.map(stripMongoId),
  };
}

export async function writePlatformData(_data: PlatformDataRecord) {
  throw new Error(
    'writePlatformData is no longer used. Persist platform records through the collection-specific store helpers.'
  );
}

export async function addActivityEntry(
  entry: Omit<ActivityLogRecord, 'id' | 'createdAt'>
) {
  await ensureMongoBootstrap();
  const { activity } = await collections();
  const nextEntry: ActivityLogRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };

  await activity.insertOne({
    _id: nextEntry.id,
    ...nextEntry,
  });
}

export function findProjectById(data: PlatformDataRecord, projectId: string) {
  return data.projects.find((project) => project.id === projectId) ?? null;
}

export async function createProject(input: {
  actorLabel: string;
  clientId: string;
  projectName: string;
  description: string;
  status: ProjectRecord['status'];
  phase: string;
  health: ProjectRecord['health'];
  startDate: string;
  targetCompletionDate: string;
  internalLead: string;
  primaryClientContact: string;
}) {
  await ensureMongoBootstrap();
  const { projects } = await collections();
  const projectId = crypto.randomUUID();
  const project: ProjectRecord = {
    id: projectId,
    clientId: input.clientId,
    projectName: input.projectName.trim(),
    description: input.description.trim(),
    status: input.status,
    phase: input.phase.trim(),
    health: input.health,
    startDate: input.startDate,
    targetCompletionDate: input.targetCompletionDate,
    internalLead: input.internalLead.trim(),
    primaryClientContact: input.primaryClientContact.trim(),
    progressPercent: 0,
    nextMilestoneId: '',
    lastUpdated: new Date().toISOString(),
    internalNotes: '',
  };

  await projects.insertOne({
    _id: project.id,
    ...project,
  });

  await addActivityEntry({
    actorLabel: input.actorLabel,
    projectId,
    type: 'project_created',
    message: `Created project ${project.projectName}.`,
  });

  return project;
}

export async function updateProject(
  input: Partial<ProjectRecord> & {
    actorLabel: string;
    id: string;
  }
) {
  await ensureMongoBootstrap();
  const { projects } = await collections();
  const currentProject = await projects.findOne({ _id: input.id });

  if (!currentProject) {
    throw new Error('Project not found.');
  }

  const nextProject: ProjectRecord = {
    ...stripMongoId(currentProject),
    ...input,
    lastUpdated: new Date().toISOString(),
  };

  await projects.updateOne(
    { _id: input.id },
    {
      $set: {
        ...nextProject,
        id: input.id,
      },
    }
  );

  await addActivityEntry({
    actorLabel: input.actorLabel,
    projectId: nextProject.id,
    type: 'project_updated',
    message: `Updated project details for ${nextProject.projectName}.`,
  });

  return nextProject;
}

export async function saveMilestone(
  input: Omit<MilestoneRecord, 'updatedAt'> & { actorLabel: string }
) {
  await ensureMongoBootstrap();
  const { milestones, projects } = await collections();
  const existingMilestone = await milestones.findOne({ _id: input.id });
  const milestone: MilestoneRecord = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await milestones.updateOne(
    { _id: input.id },
    {
      $set: {
        ...milestone,
        id: input.id,
      },
    },
    { upsert: true }
  );

  await addActivityEntry({
    actorLabel: input.actorLabel,
    projectId: input.projectId,
    type: existingMilestone ? 'milestone_updated' : 'milestone_added',
    message: `${existingMilestone ? 'Updated' : 'Added'} milestone ${input.title}.`,
  });

  const project = await projects.findOne({ _id: input.projectId });

  if (project && (!project.nextMilestoneId || milestone.status !== 'Complete')) {
    await projects.updateOne(
      { _id: input.projectId },
      {
        $set: {
          nextMilestoneId: milestone.id,
          lastUpdated: new Date().toISOString(),
        },
      }
    );
  }

  return milestone;
}

export async function saveDecision(
  input: DecisionRecord & { actorLabel: string }
) {
  await ensureMongoBootstrap();
  const { decisions } = await collections();
  const existingDecision = await decisions.findOne({ _id: input.id });
  const decision: DecisionRecord = {
    id: input.id,
    projectId: input.projectId,
    decision: input.decision.trim(),
    madeBy: input.madeBy.trim(),
    date: input.date,
    notes: input.notes.trim(),
    milestoneId: input.milestoneId,
    clientVisible: input.clientVisible,
  };

  await decisions.updateOne(
    { _id: input.id },
    {
      $set: {
        ...decision,
        id: input.id,
      },
    },
    { upsert: true }
  );

  await addActivityEntry({
    actorLabel: input.actorLabel,
    projectId: input.projectId,
    type: existingDecision ? 'project_updated' : 'decision_added',
    message: `${existingDecision ? 'Updated' : 'Added'} a decision record for ${decision.decision}.`,
  });

  return decision;
}

export async function saveActionItem(
  input: ActionItemRecord & { actorLabel: string }
) {
  await ensureMongoBootstrap();
  const { actionItems } = await collections();
  const existingActionItem = await actionItems.findOne({ _id: input.id });
  const actionItem: ActionItemRecord = {
    id: input.id,
    projectId: input.projectId,
    relatedMilestoneId: input.relatedMilestoneId,
    description: input.description.trim(),
    assignedTo: input.assignedTo.trim(),
    ownerType: input.ownerType,
    dueDate: input.dueDate,
    status: input.status,
    clientVisible: input.clientVisible,
  };

  await actionItems.updateOne(
    { _id: input.id },
    {
      $set: {
        ...actionItem,
        id: input.id,
      },
    },
    { upsert: true }
  );

  await addActivityEntry({
    actorLabel: input.actorLabel,
    projectId: input.projectId,
    type: existingActionItem ? 'action_item_updated' : 'action_item_added',
    message: `${existingActionItem ? 'Updated' : 'Added'} action item ${actionItem.description}.`,
  });

  return actionItem;
}

export async function saveResource(
  input: ResourceRecord & { actorLabel: string }
) {
  await ensureMongoBootstrap();
  const { resources } = await collections();
  const resource: ResourceRecord = {
    id: input.id,
    projectId: input.projectId,
    title: input.title.trim(),
    url: input.url.trim(),
    type: input.type,
    addedAt: input.addedAt,
    clientVisible: input.clientVisible,
  };

  await resources.updateOne(
    { _id: input.id },
    {
      $set: {
        ...resource,
        id: input.id,
      },
    },
    { upsert: true }
  );

  await addActivityEntry({
    actorLabel: input.actorLabel,
    projectId: input.projectId,
    type: 'project_updated',
    message: `Updated resources for project ${input.projectId}.`,
  });

  return resource;
}

export async function createClientRecord(input: {
  actorLabel: string;
  companyName: string;
  primaryContact: string;
  email: string;
}) {
  await ensureMongoBootstrap();
  const { clients } = await collections();
  const client: ClientRecord = {
    id: crypto.randomUUID(),
    companyName: input.companyName.trim(),
    primaryContact: input.primaryContact.trim(),
    email: input.email.trim(),
  };

  await clients.insertOne({
    _id: client.id,
    ...client,
  });

  await addActivityEntry({
    actorLabel: input.actorLabel,
    type: 'client_created',
    message: `Created client record for ${client.companyName}.`,
  });

  return client;
}

export async function updateClientRecord(
  input: Partial<ClientRecord> & {
    actorLabel: string;
    id: string;
  }
) {
  await ensureMongoBootstrap();
  const { clients } = await collections();
  const currentClient = await clients.findOne({ _id: input.id });

  if (!currentClient) {
    throw new Error('Client not found.');
  }

  const client: ClientRecord = {
    ...stripMongoId(currentClient),
    ...input,
    companyName: `${input.companyName ?? currentClient.companyName}`.trim(),
    primaryContact: `${input.primaryContact ?? currentClient.primaryContact}`.trim(),
    email: `${input.email ?? currentClient.email}`.trim(),
  };

  await clients.updateOne(
    { _id: input.id },
    {
      $set: {
        ...client,
        id: input.id,
      },
    }
  );

  await addActivityEntry({
    actorLabel: input.actorLabel,
    type: 'client_access_updated',
    message: `Updated client record for ${client.companyName}.`,
  });

  return client;
}
