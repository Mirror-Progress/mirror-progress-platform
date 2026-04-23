import React from 'react';
import type { ActionItemRecord, WorkspaceSnapshot } from '../../lib/workspace-data';
import {
  formatShortDate,
  OwnerPill,
  StatusPill,
  WorkspaceSectionHeading,
} from './shared';

interface OpenItemsPanelProps {
  workspace: WorkspaceSnapshot;
}

function sortActionItems(items: ActionItemRecord[]) {
  return [...items].sort((first, second) =>
    new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime()
  );
}

const OpenItemsPanel: React.FC<OpenItemsPanelProps> = ({ workspace }) => {
  const openItems = sortActionItems(
    workspace.actionItems.filter((item) => item.status !== 'Complete')
  );

  return (
    <section id="workspace-open-items" className="flex flex-col gap-[28px]">
      <WorkspaceSectionHeading
        eyebrow="[ Open Items ]"
        title="Pending work and responsibilities"
        description="A calm record of what is still open, who owns it, and what timeline the current work depends on."
      />

      <div className="grid gap-[16px]">
        {openItems.map((item) => (
          <article
            key={item.id}
            className="theme-panel grid gap-[18px] rounded-[30px] px-[24px] py-[22px] md:grid-cols-[1.4fr_auto_auto] md:items-center max-md:rounded-[24px] max-md:px-[18px] max-md:py-[18px]"
          >
            <div className="flex flex-col gap-[10px]">
              <p className="font-dmSans text-[22px] font-light leading-110 tracking-m3p max-md:text-[18px]">
                {item.description}
              </p>
              <p className="theme-page-muted font-dmSans text-[15px] leading-120">
                Owner: {item.assignedTo}
              </p>
            </div>

            <div className="flex flex-wrap gap-[10px]">
              <OwnerPill label={item.ownerType} />
              <StatusPill label={item.status} />
            </div>

            <div className="text-left md:text-right">
              <p className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                Due
              </p>
              <p className="mt-[8px] font-dmSans text-[16px] leading-120 text-[color:var(--theme-page-text)]">
                {formatShortDate(item.dueDate)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default OpenItemsPanel;
