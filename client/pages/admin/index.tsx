import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Link from 'next/link';
import React from 'react';
import AdminShell from '../../components/admin/AdminShell';
import {
  AdminMetricCard,
  AdminPanel,
  AdminPill,
  formatAdminDate,
  formatAdminDateTime,
} from '../../components/admin/shared';
import { listAccounts } from '../../lib/accounts';
import {
  buildAdminDashboardMetrics,
  getProjectsRequiringAttention,
  getRecentActivity,
  getRecentlyLoggedInClients,
  getRecentlyUpdatedProjects,
  getUpcomingMilestones,
} from '../../lib/admin-view';
import { requireAdminPageAccess } from '../../lib/auth-guards';
import { readPlatformData } from '../../lib/platform-store';
import { listLatestWorkspaceViews } from '../../lib/workspace-store';

interface AdminDashboardProps {
  metrics: ReturnType<typeof buildAdminDashboardMetrics>;
  recentProjects: ReturnType<typeof getRecentlyUpdatedProjects>;
  upcomingMilestones: ReturnType<typeof getUpcomingMilestones>;
  attentionProjects: ReturnType<typeof getProjectsRequiringAttention>;
  recentActivity: ReturnType<typeof getRecentActivity>;
  recentlyLoggedInClients: ReturnType<typeof getRecentlyLoggedInClients>;
  latestViews: Awaited<ReturnType<typeof listLatestWorkspaceViews>>;
}

const AdminDashboardPage: React.FC<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({
  metrics,
  recentProjects,
  upcomingMilestones,
  attentionProjects,
  recentActivity,
  recentlyLoggedInClients,
  latestViews,
}: AdminDashboardProps) => {
  return (
    <AdminShell
      title="Operational overview"
      description="A centralized internal interface for managing all client projects, milestones, decisions, action items, client access, and project activity across the Mirror Progress client workspace platform."
      actions={
        <>
          <Link
            href="/admin/projects#create-project"
            className="theme-primary-button inline-flex rounded-[999px] px-[16px] py-[11px] font-diatype text-[11px] uppercase tracking-m3p"
          >
            Create Project
          </Link>
          <Link
            href="/admin/clients#create-client"
            className="theme-secondary-button inline-flex rounded-[999px] px-[16px] py-[11px] font-diatype text-[11px] uppercase tracking-m3p"
          >
            Invite Client
          </Link>
        </>
      }
    >
      <div className="grid gap-[16px] md:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard
          label="Active Projects"
          value={metrics.activeProjects}
          description="All active internal project records."
        />
        <AdminMetricCard
          label="Awaiting Client"
          value={metrics.awaitingClientProjects}
          description="Projects waiting on a client-side response."
        />
        <AdminMetricCard
          label="Projects In Progress"
          value={metrics.inProgressProjects}
          description="Projects moving through the current delivery phase."
        />
        <AdminMetricCard
          label="Overdue Items"
          value={metrics.overdueActionItems}
          description="Open action items that have passed their due date."
        />
        <AdminMetricCard
          label="Completed This Month"
          value={metrics.completedThisMonth}
          description="Projects marked complete during the current month."
        />
      </div>

      <div className="grid gap-[16px] xl:grid-cols-[1.1fr_1fr]">
        <AdminPanel
          title="Recent project updates"
          description="The most recently updated project records across the platform."
        >
          <div className="grid gap-[12px]">
            {recentProjects.map(({ project, client, nextMilestone }) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="theme-card theme-card-interactive rounded-[24px] px-[16px] py-[14px] transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div>
                    <p className="font-dmSans text-[20px] font-light leading-110">
                      {project.projectName}
                    </p>
                    <p className="theme-page-muted mt-[6px] font-dmSans text-[14px] leading-120">
                      {client?.companyName ?? 'Unknown client'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-[8px]">
                    <AdminPill label={project.status} />
                    <AdminPill label={project.health} />
                  </div>
                </div>
                <div className="theme-page-muted mt-[12px] flex flex-wrap items-center justify-between gap-[10px] font-dmSans text-[14px] leading-120">
                  <span>Next Milestone: {nextMilestone?.title ?? 'Not set'}</span>
                  <span>Updated {formatAdminDateTime(project.lastUpdated)}</span>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Upcoming milestone dates"
          description="Near-term milestones that will shape the next review cycle."
        >
          <div className="grid gap-[12px]">
            {upcomingMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="theme-card rounded-[24px] px-[16px] py-[14px]"
              >
                <div className="flex flex-wrap items-start justify-between gap-[10px]">
                  <div>
                    <p className="font-dmSans text-[19px] font-light leading-110">
                      {milestone.title}
                    </p>
                    <p className="theme-page-muted mt-[6px] font-dmSans text-[14px] leading-120">
                      {milestone.stageLabel}
                    </p>
                  </div>
                  <AdminPill label={milestone.status} />
                </div>
                <p className="theme-page-muted mt-[12px] font-dmSans text-[14px] leading-120">
                  {formatAdminDate(milestone.date)}
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-[16px] xl:grid-cols-[1.05fr_1fr_1fr]">
        <AdminPanel
          title="Projects requiring attention"
          description="Projects with delivery risk, overdue items, or explicit client dependency."
        >
          <div className="grid gap-[12px]">
            {attentionProjects.map(({ project, client, overdueItemCount }) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="theme-card theme-card-interactive rounded-[24px] px-[16px] py-[14px] transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-[10px]">
                  <p className="font-dmSans text-[19px] font-light leading-110">
                    {project.projectName}
                  </p>
                  <AdminPill label={project.health} />
                </div>
                <p className="theme-page-muted mt-[8px] font-dmSans text-[14px] leading-120">
                  {client?.companyName ?? 'Unknown client'}
                </p>
                <p className="theme-page-muted mt-[10px] font-dmSans text-[14px] leading-120">
                  Overdue action items: {overdueItemCount}
                </p>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Recent activity"
          description="The latest recorded project and access changes."
        >
          <div className="grid gap-[12px]">
            {recentActivity.slice(0, 6).map((entry) => (
              <div
                key={entry.id}
                className="theme-card rounded-[24px] px-[16px] py-[14px]"
              >
                <p className="font-dmSans text-[16px] leading-120 text-[color:var(--theme-page-text)]">
                  {entry.message}
                </p>
                <p className="theme-page-subtle mt-[8px] font-dmSans text-[13px] leading-120">
                  {entry.actorLabel} · {formatAdminDateTime(entry.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Client access signals"
          description="Recent client login and workspace-view signals where available."
        >
          <div className="grid gap-[12px]">
            {recentlyLoggedInClients.map((account) => {
              const latestView = latestViews.find((view) => view.userId === account.id);

              return (
                <div
                  key={account.id}
                  className="theme-card rounded-[24px] px-[16px] py-[14px]"
                >
                  <p className="font-dmSans text-[17px] font-light leading-110">
                    {account.name}
                  </p>
                  <p className="theme-page-muted mt-[6px] font-dmSans text-[14px] leading-120">
                    {account.company}
                  </p>
                  <p className="theme-page-subtle mt-[10px] font-dmSans text-[13px] leading-120">
                    Last login {account.lastLoginAt ? formatAdminDateTime(account.lastLoginAt) : 'Not recorded'}
                  </p>
                  <p className="theme-page-subtle mt-[4px] font-dmSans text-[13px] leading-120">
                    Last viewed {latestView?.latestViewedAt ? formatAdminDateTime(latestView.latestViewedAt) : 'Not recorded'}
                  </p>
                </div>
              );
            })}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
};

export const getServerSideProps: GetServerSideProps<AdminDashboardProps> = async (
  context
) => {
  const access = await requireAdminPageAccess<AdminDashboardProps>(context);

  if (access.redirect) {
    return access.redirect;
  }

  const data = await readPlatformData();
  const accounts = await listAccounts();
  const latestViews = await listLatestWorkspaceViews();

  return {
    props: {
      metrics: buildAdminDashboardMetrics(data),
      recentProjects: getRecentlyUpdatedProjects(data),
      upcomingMilestones: getUpcomingMilestones(data),
      attentionProjects: getProjectsRequiringAttention(data),
      recentActivity: getRecentActivity(data),
      recentlyLoggedInClients: getRecentlyLoggedInClients(accounts),
      latestViews,
    },
  };
};

export default AdminDashboardPage;
