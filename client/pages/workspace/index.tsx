import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Link from 'next/link';
import React from 'react';
import AccountMenu from '../../components/AccountMenu';
import ThemeToggle from '../../components/ThemeToggle';
import DecisionLog from '../../components/workspace/DecisionLog';
import MilestoneTimeline from '../../components/workspace/MilestoneTimeline';
import OpenItemsPanel from '../../components/workspace/OpenItemsPanel';
import ResourceLibrary from '../../components/workspace/ResourceLibrary';
import WorkspaceOverview from '../../components/workspace/WorkspaceOverview';
import type { WorkspaceSnapshot } from '../../lib/workspace-data';
import { buildWorkspaceSnapshot, findProjectForUser } from '../../lib/workspace-data';
import { getSessionAccountFromContext } from '../../lib/auth-guards';
import { readPlatformData } from '../../lib/platform-store';
import { getWorkspaceView, recordWorkspaceView } from '../../lib/workspace-store';

interface WorkspacePageProps {
  workspace: WorkspaceSnapshot | null;
}

const workspaceAnchors = [
  { id: 'workspace-overview', label: 'Overview' },
  { id: 'workspace-milestones', label: 'Milestones' },
  { id: 'workspace-decisions', label: 'Decisions' },
  { id: 'workspace-open-items', label: 'Open Items' },
  { id: 'workspace-files', label: 'Files / Links' },
];

const WorkspacePage: React.FC<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ workspace }: WorkspacePageProps) => {
  return (
    <section className="theme-page basic-pd min-h-screen py-[24px] md:py-[28px]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-[28px]">
        <header className="theme-panel-strong rounded-[32px] px-[28px] py-[22px] max-md:rounded-[24px] max-md:px-[18px] max-md:py-[16px]">
          <div className="flex flex-wrap items-center justify-between gap-[16px]">
            <div className="flex flex-col gap-[12px]">
              <Link
                href="/"
                className="theme-page-subtle font-diatype text-[11px] uppercase tracking-m3p transition hover:text-[color:var(--theme-page-text)]"
              >
                Back Home
              </Link>
              <div className="flex flex-col gap-[10px]">
                <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
                  Client Workspace
                </span>
                <h1 className="font-dmSans text-[44px] font-light leading-100 tracking-m3p max-md:text-[30px]">
                  {workspace?.client.companyName ?? 'Access pending'}
                </h1>
                <p className="theme-page-muted max-w-[640px] font-dmSans text-[17px] leading-120 max-md:text-[15px]">
                  A lightweight project dashboard that keeps milestones, decisions,
                  next steps, and responsibilities aligned in one place.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-[16px] md:items-end">
              <div className="flex items-center gap-[10px]">
                <ThemeToggle />
                <AccountMenu />
              </div>
              {workspace ? (
                <div className="flex flex-wrap gap-[8px]">
                  {workspaceAnchors.map((anchor) => (
                    <a
                      key={anchor.id}
                      href={`#${anchor.id}`}
                      className="theme-chip rounded-[999px] px-[12px] py-[9px] font-diatype text-[11px] uppercase tracking-m3p transition"
                    >
                      {anchor.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {workspace ? (
          <div className="flex flex-col gap-[18px]">
            <WorkspaceOverview workspace={workspace} />
            <MilestoneTimeline workspace={workspace} />
            <DecisionLog workspace={workspace} />
            <OpenItemsPanel workspace={workspace} />
            <ResourceLibrary workspace={workspace} />
          </div>
        ) : (
          <div className="theme-panel rounded-[32px] px-[28px] py-[30px] max-md:rounded-[24px] max-md:px-[18px]">
            <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
              Workspace Access
            </span>
            <h2 className="mt-[14px] font-dmSans text-[34px] font-light leading-100 tracking-m3p max-md:text-[26px]">
              Your workspace is being prepared.
            </h2>
            <p className="theme-page-muted mt-[18px] max-w-[640px] font-dmSans text-[17px] leading-120 max-md:text-[15px]">
              Your account is active, but no client project has been assigned yet.
              Mirror Progress can connect your access from the admin dashboard once
              the project record is ready.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export const getServerSideProps: GetServerSideProps<WorkspacePageProps> = async (
  context
) => {
  const account = await getSessionAccountFromContext(context);

  if (!account) {
    return {
      redirect: {
        destination: '/?auth=login&next=/workspace',
        permanent: false,
      },
    };
  }

  const data = await readPlatformData();
  const resolvedProject = findProjectForUser(
    {
      id: account.id,
      name: account.name,
      email: account.email,
      company: account.company,
      role: account.role,
      status: account.status,
      clientId: account.clientId,
      assignedProjectIds: account.assignedProjectIds,
    },
    data
  );
  const projectId = resolvedProject?.id ?? null;
  const lastViewedAt =
    projectId && account.role === 'client'
      ? await getWorkspaceView(account.id, projectId)
      : null;
  const workspace = buildWorkspaceSnapshot({
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      company: account.company,
      role: account.role,
      status: account.status,
      clientId: account.clientId,
      assignedProjectIds: account.assignedProjectIds,
    },
    data,
    lastViewedAt,
  });

  if (workspace && projectId && account.role === 'client') {
    try {
      await recordWorkspaceView({
        userId: account.id,
        projectId,
      });
    } catch {
      // Workspace view tracking is best-effort in limited deployments.
    }
  }

  return {
    props: {
      workspace,
    },
  };
};

export default WorkspacePage;
