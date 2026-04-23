import type { StoredAccount } from './accounts';
import type {
  ActivityLogRecord,
  ClientRecord,
  MilestoneRecord,
  PlatformDataRecord,
  ProjectRecord,
} from './workspace-data';

export interface ProjectDirectoryRow {
  project: ProjectRecord;
  client: ClientRecord | null;
  nextMilestone: MilestoneRecord | null;
  overdueItemCount: number;
}

export function buildProjectDirectoryRows(data: PlatformDataRecord) {
  return data.projects.map((project) => {
    const client = data.clients.find((entry) => entry.id === project.clientId) ?? null;
    const nextMilestone =
      data.milestones.find((milestone) => milestone.id === project.nextMilestoneId) ??
      null;
    const overdueItemCount = data.actionItems.filter(
      (actionItem) =>
        actionItem.projectId === project.id &&
        actionItem.status !== 'Complete' &&
        new Date(actionItem.dueDate).getTime() < Date.now()
    ).length;

    return {
      project,
      client,
      nextMilestone,
      overdueItemCount,
    };
  });
}

export function buildAdminDashboardMetrics(data: PlatformDataRecord) {
  const activeProjects = data.projects.filter(
    (project) => project.status !== 'Complete'
  ).length;
  const awaitingClientProjects = data.projects.filter(
    (project) => project.status === 'Awaiting Client Response'
  ).length;
  const inProgressProjects = data.projects.filter(
    (project) => project.status === 'In Progress'
  ).length;
  const overdueActionItems = data.actionItems.filter(
    (actionItem) =>
      actionItem.status !== 'Complete' &&
      new Date(actionItem.dueDate).getTime() < Date.now()
  ).length;
  const completedThisMonth = data.projects.filter((project) => {
    if (project.status !== 'Complete') {
      return false;
    }

    const projectDate = new Date(project.lastUpdated);
    const now = new Date();
    return (
      projectDate.getUTCFullYear() === now.getUTCFullYear() &&
      projectDate.getUTCMonth() === now.getUTCMonth()
    );
  }).length;

  return {
    activeProjects,
    awaitingClientProjects,
    inProgressProjects,
    overdueActionItems,
    completedThisMonth,
  };
}

export function getRecentlyUpdatedProjects(data: PlatformDataRecord) {
  return [...buildProjectDirectoryRows(data)]
    .sort(
      (first, second) =>
        new Date(second.project.lastUpdated).getTime() -
        new Date(first.project.lastUpdated).getTime()
    )
    .slice(0, 5);
}

export function getUpcomingMilestones(data: PlatformDataRecord) {
  return [...data.milestones]
    .sort(
      (first, second) =>
        new Date(first.date).getTime() - new Date(second.date).getTime()
    )
    .filter((milestone) => milestone.status !== 'Complete')
    .slice(0, 6);
}

export function getProjectsRequiringAttention(data: PlatformDataRecord) {
  return buildProjectDirectoryRows(data)
    .filter(
      ({ project, overdueItemCount }) =>
        overdueItemCount > 0 ||
        project.health === 'At Risk' ||
        project.health === 'Delayed' ||
        project.health === 'Awaiting Client'
    )
    .slice(0, 5);
}

export function getRecentActivity(data: PlatformDataRecord) {
  return [...data.activity]
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    )
    .slice(0, 12);
}

export function getRecentlyLoggedInClients(accounts: StoredAccount[]) {
  return accounts
    .filter((account) => account.role === 'client' && account.lastLoginAt)
    .sort(
      (first, second) =>
        new Date(second.lastLoginAt ?? 0).getTime() -
        new Date(first.lastLoginAt ?? 0).getTime()
    )
    .slice(0, 5);
}

export function findProjectActivity(
  activity: ActivityLogRecord[],
  projectId: string
) {
  return activity
    .filter((entry) => entry.projectId === projectId)
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
}
