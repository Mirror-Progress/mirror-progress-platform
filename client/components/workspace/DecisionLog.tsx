import React from 'react';
import type { WorkspaceSnapshot } from '../../lib/workspace-data';
import { formatDate, WorkspaceSectionHeading } from './shared';

interface DecisionLogProps {
  workspace: WorkspaceSnapshot;
}

const DecisionLog: React.FC<DecisionLogProps> = ({ workspace }) => (
  <section id="workspace-decisions" className="flex flex-col gap-[28px]">
    <WorkspaceSectionHeading
      eyebrow="[ Decisions ]"
      title="Confirmed decisions"
      description="A compact view of the major decisions already confirmed, with enough context to reduce ambiguity later."
    />

    <div className="grid gap-[16px] lg:grid-cols-2">
      {workspace.decisions.map((decision) => (
        <article
          key={decision.id}
          className="theme-panel rounded-[30px] p-[24px] max-md:rounded-[24px] max-md:p-[18px]"
        >
          <div className="flex flex-wrap items-center gap-[12px]">
            <span className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
              {formatDate(decision.date)}
            </span>
            <span className="theme-chip rounded-[999px] px-[12px] py-[7px] font-diatype text-[11px] uppercase tracking-m3p">
              {decision.madeBy}
            </span>
          </div>

          <h3 className="mt-[16px] font-dmSans text-[28px] font-light leading-105 tracking-m3p max-md:text-[22px]">
            {decision.decision}
          </h3>

          <p className="theme-page-muted mt-[16px] font-dmSans text-[16px] leading-120">
            {decision.notes}
          </p>
        </article>
      ))}
    </div>
  </section>
);

export default DecisionLog;
