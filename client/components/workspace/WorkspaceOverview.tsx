import React from 'react';
import type { WorkspaceSnapshot } from '../../lib/workspace-data';
import {
  formatDate,
  formatShortDate,
  StatusPill,
  WorkspaceSectionHeading,
} from './shared';

interface WorkspaceOverviewProps {
  workspace: WorkspaceSnapshot;
}

const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({ workspace }) => {
  const upcomingMilestone = workspace.milestones.find(
    (milestone) => milestone.id === workspace.project.nextMilestoneId
  );

  return (
    <section
      id="workspace-overview"
      className="theme-panel rounded-[36px] px-[32px] py-[34px] max-md:rounded-[28px] max-md:px-[20px] max-md:py-[22px]"
    >
      <WorkspaceSectionHeading
        eyebrow="[ Overview ]"
        title={workspace.project.projectName}
        description="A lightweight project dashboard that keeps milestones, decisions, next steps, and responsibilities aligned in one place."
      />

      <div className="mt-[28px] grid gap-[16px] lg:grid-cols-[1.4fr_1fr]">
        <div className="theme-card-soft rounded-[28px] p-[24px] max-md:rounded-[22px] max-md:p-[18px]">
          <div className="flex flex-wrap items-center gap-[12px]">
            <StatusPill label={workspace.project.status} />
            <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
              Phase · {workspace.project.phase}
            </span>
            <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
              Health · {workspace.project.health}
            </span>
          </div>

          <p className="mt-[18px] max-w-[780px] font-dmSans text-[20px] font-light leading-120 text-[color:var(--theme-page-text)] max-md:text-[17px]">
            {workspace.project.description}
          </p>

          <div className="mt-[24px] grid gap-[14px] md:grid-cols-2">
            <div className="theme-card rounded-[22px] p-[18px]">
              <p className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                Upcoming Milestone
              </p>
              <p className="mt-[10px] font-dmSans text-[24px] font-light leading-105 tracking-m3p max-md:text-[20px]">
                {upcomingMilestone?.title ?? 'To be confirmed'}
              </p>
              {upcomingMilestone ? (
                <p className="theme-page-muted mt-[12px] font-dmSans text-[15px] leading-120">
                  {formatDate(upcomingMilestone.date)}
                </p>
              ) : null}
            </div>

            <div className="theme-card rounded-[22px] p-[18px]">
              <p className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                Timeline Progress
              </p>
              <p className="mt-[10px] font-dmSans text-[36px] font-light leading-100 tracking-m3p max-md:text-[30px]">
                {workspace.project.progressPercent}%
              </p>
              <div className="theme-progress-track mt-[14px] h-[8px] overflow-hidden rounded-full">
                <div
                  className="theme-progress-fill h-full rounded-full"
                  style={{ width: `${workspace.project.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[16px]">
          <div className="theme-card-soft rounded-[28px] p-[24px] max-md:rounded-[22px] max-md:p-[18px]">
            <p className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
              Project Details
            </p>
            <div className="mt-[18px] grid gap-[14px]">
              <div className="theme-divider flex items-start justify-between gap-[14px] border-b pb-[12px]">
                <span className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                  Last Updated
                </span>
                <span className="font-dmSans text-[16px] leading-120 text-[color:var(--theme-page-text)]">
                  {formatDate(workspace.project.lastUpdated)}
                </span>
              </div>
              <div className="theme-divider flex items-start justify-between gap-[14px] border-b pb-[12px]">
                <span className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                  Last Viewed
                </span>
                <span className="font-dmSans text-[16px] leading-120 text-[color:var(--theme-page-text)]">
                  {workspace.lastViewedAt
                    ? formatShortDate(workspace.lastViewedAt)
                    : 'First workspace visit'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-[14px]">
                <span className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                  Timeline Window
                </span>
                <span className="text-right font-dmSans text-[16px] leading-120 text-[color:var(--theme-page-text)]">
                  {formatShortDate(workspace.project.startDate)} to{' '}
                  {formatShortDate(workspace.project.targetCompletionDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="theme-card-soft rounded-[28px] p-[24px] max-md:rounded-[22px] max-md:p-[18px]">
            <p className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
              Key Contacts
            </p>
            <div className="mt-[18px] grid gap-[14px]">
              {workspace.keyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="theme-card rounded-[20px] px-[16px] py-[14px]"
                >
                  <p className="font-dmSans text-[19px] font-light leading-110">
                    {contact.name}
                  </p>
                  <p className="theme-eyebrow mt-[6px] font-diatype text-[11px] uppercase tracking-m3p">
                    {contact.role}
                  </p>
                  <p className="theme-page-muted mt-[10px] font-dmSans text-[15px] leading-120">
                    {contact.email}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkspaceOverview;
