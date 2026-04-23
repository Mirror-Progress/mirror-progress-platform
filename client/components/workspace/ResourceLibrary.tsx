import React from 'react';
import type { WorkspaceSnapshot } from '../../lib/workspace-data';
import {
  formatShortDate,
  ResourcePill,
  WorkspaceSectionHeading,
} from './shared';

interface ResourceLibraryProps {
  workspace: WorkspaceSnapshot;
}

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ workspace }) => (
  <section id="workspace-files" className="flex flex-col gap-[28px]">
    <WorkspaceSectionHeading
      eyebrow="[ Files / Links ]"
      title="Project resources"
      description="A simple library of the current materials referenced in the project record."
    />

    <div className="grid gap-[16px] md:grid-cols-2 xl:grid-cols-3">
      {workspace.resources.map((resource) => (
        <article
          key={resource.id}
          className="theme-panel flex h-full flex-col justify-between rounded-[30px] p-[24px] max-md:rounded-[24px] max-md:p-[18px]"
        >
          <div className="flex flex-col gap-[18px]">
            <ResourcePill label={resource.type} />
            <div>
              <h3 className="font-dmSans text-[24px] font-light leading-110 tracking-m3p max-md:text-[20px]">
                {resource.title}
              </h3>
              <p className="theme-page-muted mt-[12px] font-dmSans text-[15px] leading-120">
                Added {formatShortDate(resource.addedAt)}
              </p>
            </div>
          </div>

          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="theme-chip mt-[24px] inline-flex rounded-[999px] px-[14px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p transition"
          >
            Open resource
          </a>
        </article>
      ))}
    </div>
  </section>
);

export default ResourceLibrary;
