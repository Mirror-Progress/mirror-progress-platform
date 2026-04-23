import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { Fragment } from 'react';
import type { ResourceRecord, WorkspaceSnapshot } from '../../lib/workspace-data';
import {
  formatDate,
  StatusPill,
  WorkspaceSectionHeading,
} from './shared';

interface MilestoneTimelineProps {
  workspace: WorkspaceSnapshot;
}

const DetailList: React.FC<{ title: string; items: string[] }> = ({
  title,
  items,
}) => (
  <div className="theme-card rounded-[22px] p-[18px]">
    <p className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
      {title}
    </p>
    <div className="mt-[12px] flex flex-col gap-[10px]">
      {items.map((item) => (
        <p key={item} className="theme-page-muted font-dmSans text-[15px] leading-120">
          {item}
        </p>
      ))}
    </div>
  </div>
);

function findResources(
  resources: ResourceRecord[],
  attachmentIds: string[]
) {
  return attachmentIds
    .map((attachmentId) =>
      resources.find((resource) => resource.id === attachmentId) ?? null
    )
    .filter((resource): resource is ResourceRecord => Boolean(resource));
}

const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ workspace }) => (
  <section id="workspace-milestones" className="flex flex-col gap-[28px]">
    <WorkspaceSectionHeading
      eyebrow="[ Milestones ]"
      title="Milestone timeline"
      description="Each milestone is structured around what happened, what was decided, what is next, who owns it, and by when."
    />

    <div className="flex flex-col gap-[16px]">
      {workspace.milestones.map((milestone) => {
        const relatedResources = findResources(
          workspace.resources,
          milestone.attachmentIds
        );

        return (
          <Disclosure key={milestone.id} defaultOpen={milestone.status === 'In Progress'}>
            {({ open }) => (
              <div className="theme-panel rounded-[32px] max-md:rounded-[24px]">
                <Disclosure.Button className="flex w-full items-start justify-between gap-[16px] px-[28px] py-[24px] text-left max-md:px-[18px] max-md:py-[18px]">
                  <div className="flex min-w-0 flex-col gap-[14px]">
                    <div className="flex flex-wrap items-center gap-[12px]">
                      <StatusPill label={milestone.status} />
                      <span className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                        {formatDate(milestone.date)}
                      </span>
                    </div>
                    <h3 className="font-dmSans text-[30px] font-light leading-100 tracking-m3p max-md:text-[24px]">
                      {milestone.title}
                    </h3>
                    <p className="theme-page-muted max-w-[780px] font-dmSans text-[17px] leading-120 max-md:text-[15px]">
                      {milestone.summary}
                    </p>
                  </div>

                  <span className="theme-secondary-button inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full">
                    <ChevronDownIcon
                      className={`h-[18px] w-[18px] transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </span>
                </Disclosure.Button>

                <Transition
                  as={Fragment}
                  enter="transition duration-200 ease-out"
                  enterFrom="opacity-0 -translate-y-2"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition duration-150 ease-in"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 -translate-y-2"
                >
                  <Disclosure.Panel className="theme-divider border-t px-[28px] py-[24px] max-md:px-[18px] max-md:py-[18px]">
                    <div className="grid gap-[16px] lg:grid-cols-2">
                      <div className="theme-card-soft rounded-[24px] p-[18px]">
                        <p className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                          What happened
                        </p>
                        <p className="theme-page-muted mt-[12px] font-dmSans text-[16px] leading-120">
                          {milestone.details}
                        </p>
                      </div>

                      <div className="theme-card-soft rounded-[24px] p-[18px]">
                        <p className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                          By when
                        </p>
                        <p className="mt-[12px] font-dmSans text-[24px] font-light leading-100 tracking-m3p">
                          {formatDate(milestone.dueDate)}
                        </p>
                        <p className="theme-page-muted mt-[12px] font-dmSans text-[15px] leading-120">
                          Updated {formatDate(milestone.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-[16px] grid gap-[16px] lg:grid-cols-3">
                      <DetailList
                        title="What was decided"
                        items={milestone.decisions}
                      />
                      <DetailList
                        title="Client next steps"
                        items={milestone.clientActionItems}
                      />
                      <DetailList
                        title="Mirror Progress next steps"
                        items={milestone.internalActionItems}
                      />
                    </div>

                    {relatedResources.length ? (
                      <div className="theme-card-soft mt-[16px] rounded-[24px] p-[18px]">
                        <p className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                          Related files and links
                        </p>
                        <div className="mt-[12px] flex flex-wrap gap-[10px]">
                          {relatedResources.map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="theme-chip inline-flex rounded-[999px] px-[14px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p transition"
                            >
                              {resource.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </Disclosure.Panel>
                </Transition>
              </div>
            )}
          </Disclosure>
        );
      })}
    </div>
  </section>
);

export default MilestoneTimeline;
