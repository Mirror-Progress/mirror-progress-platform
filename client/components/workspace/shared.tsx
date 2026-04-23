import React from 'react';
import type {
  ActionItemStatus,
  MilestoneStatus,
  OwnerType,
  ProjectStatus,
  ResourceType,
} from '../../lib/workspace-data';

type WorkspaceStatus = ActionItemStatus | MilestoneStatus | ProjectStatus;

const statusToneMap: Record<WorkspaceStatus, string> = {
  Complete: 'border-[#B8D0CF]/35 bg-[#DDE8E8] text-primary',
  'In Progress': 'border-[#7FAAAA]/35 bg-[#163838] text-[#DDE8E8]',
  'Awaiting Client Response': 'border-[#D4BE93]/30 bg-[#3A3324] text-[#F3E3BF]',
  'Awaiting Client': 'border-[#D4BE93]/30 bg-[#3A3324] text-[#F3E3BF]',
  Delayed: 'border-[#A86161]/25 bg-[#332222] text-[#F2C6C6]',
  Upcoming:
    'border-[color:var(--theme-chip-border)] bg-[color:var(--theme-chip-bg)] text-[color:var(--theme-page-text)]',
  'Not Started':
    'border-[color:var(--theme-chip-border)] bg-[color:var(--theme-chip-bg)] text-[color:var(--theme-page-text)]',
  Blocked: 'border-[#A86161]/25 bg-[#332222] text-[#F2C6C6]',
};

const ownerToneMap: Record<OwnerType, string> = {
  Client: 'border-[#D4BE93]/30 bg-[#3A3324] text-[#F3E3BF]',
  'Mirror Progress':
    'border-[color:var(--theme-chip-border)] bg-[color:var(--theme-chip-bg)] text-[color:var(--theme-page-text)]',
};

const resourceToneMap: Record<ResourceType, string> = {
  Deck: 'border-[color:var(--theme-chip-border)] bg-[color:var(--theme-chip-bg)] text-[color:var(--theme-page-text)]',
  Doc: 'border-[#7FAAAA]/35 bg-[#163838] text-[#DDE8E8]',
  Prototype: 'border-[#D4BE93]/30 bg-[#3A3324] text-[#F3E3BF]',
  Deliverable: 'border-[#B8D0CF]/35 bg-[#DDE8E8] text-primary',
};

export const WorkspaceSectionHeading: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
}> = ({ eyebrow, title, description }) => (
  <div className="flex flex-col gap-[14px]">
    <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
      {eyebrow}
    </span>
    <div className="flex flex-col gap-[14px] md:max-w-[760px]">
      <h2 className="font-dmSans text-[38px] font-light leading-100 tracking-m3p max-md:text-[28px]">
        {title}
      </h2>
      <p className="theme-page-muted font-dmSans text-[17px] leading-120 max-md:text-[15px]">
        {description}
      </p>
    </div>
  </div>
);

export const StatusPill: React.FC<{ label: WorkspaceStatus }> = ({ label }) => (
  <span
    className={`inline-flex rounded-[999px] border px-[12px] py-[7px] font-diatype text-[11px] uppercase tracking-m3p ${statusToneMap[label]}`}
  >
    {label}
  </span>
);

export const OwnerPill: React.FC<{ label: OwnerType }> = ({ label }) => (
  <span
    className={`inline-flex rounded-[999px] border px-[12px] py-[7px] font-diatype text-[11px] uppercase tracking-m3p ${ownerToneMap[label]}`}
  >
    {label}
  </span>
);

export const ResourcePill: React.FC<{ label: ResourceType }> = ({ label }) => (
  <span
    className={`inline-flex rounded-[999px] border px-[12px] py-[7px] font-diatype text-[11px] uppercase tracking-m3p ${resourceToneMap[label]}`}
  >
    {label}
  </span>
);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
