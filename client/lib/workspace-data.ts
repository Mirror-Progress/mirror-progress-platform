export type UserRole = 'super_admin' | 'admin' | 'project_lead' | 'client';
export type UserStatus = 'active' | 'disabled' | 'invited';
export type InviteStatus = 'ready_to_send' | 'sent' | 'accepted';

export type ProjectStatus =
  | 'In Progress'
  | 'Awaiting Client Response'
  | 'Complete'
  | 'Delayed';
export type ProjectHealth =
  | 'On Track'
  | 'At Risk'
  | 'Awaiting Client'
  | 'Delayed'
  | 'Complete';
export type MilestoneStatus =
  | 'Complete'
  | 'In Progress'
  | 'Awaiting Client'
  | 'Upcoming';
export type ActionItemStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Awaiting Client'
  | 'Blocked'
  | 'Complete';
export type OwnerType = 'Client' | 'Mirror Progress';
export type ResourceType = 'Deck' | 'Doc' | 'Prototype' | 'Deliverable';
export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'milestone_added'
  | 'milestone_updated'
  | 'decision_added'
  | 'action_item_added'
  | 'action_item_updated'
  | 'client_created'
  | 'client_access_updated'
  | 'status_changed';

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  status: UserStatus;
  clientId: string | null;
  assignedProjectIds: string[];
}

export interface ClientRecord {
  id: string;
  companyName: string;
  primaryContact: string;
  email: string;
}

export interface KeyContact {
  id: string;
  name: string;
  role: string;
  email: string;
  company: string;
}

export interface ProjectRecord {
  id: string;
  clientId: string;
  projectName: string;
  description: string;
  status: ProjectStatus;
  phase: string;
  health: ProjectHealth;
  startDate: string;
  targetCompletionDate: string;
  internalLead: string;
  primaryClientContact: string;
  progressPercent: number;
  nextMilestoneId: string;
  lastUpdated: string;
  internalNotes: string;
}

export interface MilestoneRecord {
  id: string;
  projectId: string;
  title: string;
  stageLabel: string;
  status: MilestoneStatus;
  date: string;
  summary: string;
  details: string;
  decisions: string[];
  clientActionItems: string[];
  internalActionItems: string[];
  dueDate: string;
  owner: string;
  updatedAt: string;
  internalNotes: string;
  clientVisible: boolean;
  attachmentIds: string[];
}

export interface DecisionRecord {
  id: string;
  projectId: string;
  decision: string;
  madeBy: string;
  date: string;
  notes: string;
  milestoneId?: string;
  clientVisible: boolean;
}

export interface ActionItemRecord {
  id: string;
  projectId: string;
  relatedMilestoneId?: string;
  description: string;
  assignedTo: string;
  ownerType: OwnerType;
  dueDate: string;
  status: ActionItemStatus;
  clientVisible: boolean;
}

export interface ResourceRecord {
  id: string;
  projectId: string;
  title: string;
  url: string;
  type: ResourceType;
  addedAt: string;
  clientVisible: boolean;
}

export interface ActivityLogRecord {
  id: string;
  actorUserId?: string;
  actorLabel: string;
  projectId?: string;
  type: ActivityType;
  message: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface PlatformDataRecord {
  clients: ClientRecord[];
  projects: ProjectRecord[];
  milestones: MilestoneRecord[];
  decisions: DecisionRecord[];
  actionItems: ActionItemRecord[];
  resources: ResourceRecord[];
  activity: ActivityLogRecord[];
}

export interface WorkspaceSnapshot {
  client: ClientRecord;
  project: ProjectRecord;
  milestones: MilestoneRecord[];
  decisions: DecisionRecord[];
  actionItems: ActionItemRecord[];
  resources: ResourceRecord[];
  keyContacts: KeyContact[];
  lastViewedAt: string | null;
}

export function findClientForUser(
  user: WorkspaceUser,
  clients: ClientRecord[],
  project?: ProjectRecord | null
) {
  if (project) {
    const projectClient = clients.find((client) => client.id === project.clientId) ?? null;

    if (projectClient) {
      return projectClient;
    }
  }

  return (
    (user.clientId ? clients.find((client) => client.id === user.clientId) : null) ??
    clients.find(
      (client) => client.companyName.toLowerCase() === user.company.trim().toLowerCase()
    ) ??
    null
  );
}

export function findProjectForUser(
  user: WorkspaceUser,
  data: PlatformDataRecord
) {
  if (user.assignedProjectIds.length > 0) {
    for (const projectId of user.assignedProjectIds) {
      const assignedProject =
        data.projects.find((project) => project.id === projectId) ?? null;

      if (assignedProject) {
        return assignedProject;
      }
    }
  }

  const userClient = findClientForUser(user, data.clients);

  if (!userClient) {
    return null;
  }

  return data.projects.find((project) => project.clientId === userClient.id) ?? null;
}

export function buildWorkspaceSnapshot(input: {
  user: WorkspaceUser;
  data: PlatformDataRecord;
  lastViewedAt: string | null;
}): WorkspaceSnapshot | null {
  const project = findProjectForUser(input.user, input.data);
  const client = findClientForUser(input.user, input.data.clients, project);

  if (!client || !project) {
    return null;
  }

  const milestones = input.data.milestones
    .filter(
      (milestone) => milestone.projectId === project.id && milestone.clientVisible
    )
    .sort((first, second) => {
      const firstDate = new Date(first.date).getTime();
      const secondDate = new Date(second.date).getTime();
      return secondDate - firstDate;
    });

  const decisions = input.data.decisions
    .filter(
      (decision) => decision.projectId === project.id && decision.clientVisible
    )
    .sort((first, second) => {
      const firstDate = new Date(second.date).getTime();
      const secondDate = new Date(first.date).getTime();
      return firstDate - secondDate;
    });

  const actionItems = input.data.actionItems
    .filter(
      (actionItem) => actionItem.projectId === project.id && actionItem.clientVisible
    )
    .sort(
      (first, second) =>
        new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime()
    );

  const resources = input.data.resources.filter(
    (resource) => resource.projectId === project.id && resource.clientVisible
  );

  const keyContacts: KeyContact[] = [
    {
      id: `key-${client.id}-primary`,
      name: client.primaryContact,
      role: 'Primary Client Contact',
      email: client.email,
      company: client.companyName,
    },
    {
      id: `key-${project.id}-lead`,
      name: project.internalLead,
      role: 'Mirror Progress Lead',
      email: `${project.internalLead.toLowerCase().replace(/\s+/g, '.')}@mirrorprogress.com`,
      company: 'Mirror Progress',
    },
  ];

  return {
    client,
    project,
    milestones,
    decisions,
    actionItems,
    resources,
    keyContacts,
    lastViewedAt: input.lastViewedAt,
  };
}
