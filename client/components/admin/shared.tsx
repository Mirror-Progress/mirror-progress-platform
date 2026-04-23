import React from 'react';
import type {
  ActionItemStatus,
  MilestoneStatus,
  ProjectHealth,
  ProjectStatus,
  ResourceType,
  UserStatus,
} from '../../lib/workspace-data';

type AdminTone =
  | ProjectStatus
  | ProjectHealth
  | MilestoneStatus
  | ActionItemStatus
  | ResourceType
  | UserStatus;

const adminToneMap: Record<AdminTone, string> = {
  'In Progress': 'border-[#7FAAAA]/35 bg-[#163838] text-[#DDE8E8]',
  'Awaiting Client Response': 'border-[#D4BE93]/30 bg-[#3A3324] text-[#F3E3BF]',
  Complete: 'border-[#B8D0CF]/35 bg-[#DDE8E8] text-primary',
  Delayed: 'border-[#A86161]/25 bg-[#332222] text-[#F2C6C6]',
  Upcoming:
    'border-[color:var(--theme-chip-border)] bg-[color:var(--theme-chip-bg)] text-[color:var(--theme-page-text)]',
  'On Track':
    'border-[color:var(--theme-chip-border)] bg-[color:var(--theme-chip-bg)] text-[color:var(--theme-page-text)]',
  'At Risk': 'border-[#A86161]/25 bg-[#332222] text-[#F2C6C6]',
  'Awaiting Client': 'border-[#D4BE93]/30 bg-[#3A3324] text-[#F3E3BF]',
  'Not Started':
    'border-[color:var(--theme-chip-border)] bg-[color:var(--theme-chip-bg)] text-[color:var(--theme-page-text)]',
  Blocked: 'border-[#A86161]/25 bg-[#332222] text-[#F2C6C6]',
  Deck: 'border-[color:var(--theme-chip-border)] bg-[color:var(--theme-chip-bg)] text-[color:var(--theme-page-text)]',
  Doc: 'border-[#7FAAAA]/35 bg-[#163838] text-[#DDE8E8]',
  Prototype: 'border-[#D4BE93]/30 bg-[#3A3324] text-[#F3E3BF]',
  Deliverable: 'border-[#B8D0CF]/35 bg-[#DDE8E8] text-primary',
  active:
    'border-[color:var(--theme-chip-border)] bg-[color:var(--theme-chip-bg)] text-[color:var(--theme-page-text)]',
  disabled: 'border-[#A86161]/25 bg-[#332222] text-[#F2C6C6]',
  invited: 'border-[#D4BE93]/30 bg-[#3A3324] text-[#F3E3BF]',
};

export const AdminPanel: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <section className="theme-panel rounded-[32px] px-[24px] py-[22px] max-md:rounded-[24px] max-md:px-[18px]">
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-[10px]">
        <h2 className="font-dmSans text-[28px] font-light leading-100 tracking-m3p max-md:text-[22px]">
          {title}
        </h2>
        {description ? (
          <p className="theme-page-muted font-dmSans text-[15px] leading-120">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  </section>
);

export const AdminMetricCard: React.FC<{
  label: string;
  value: string | number;
  description: string;
}> = ({ label, value, description }) => (
  <article className="theme-panel rounded-[28px] p-[20px] max-md:rounded-[22px]">
    <span className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
      {label}
    </span>
    <p className="mt-[14px] font-dmSans text-[38px] font-light leading-100 tracking-m3p max-md:text-[30px]">
      {value}
    </p>
    <p className="theme-page-muted mt-[10px] font-dmSans text-[15px] leading-120">
      {description}
    </p>
  </article>
);

export const AdminPill: React.FC<{ label: AdminTone }> = ({ label }) => (
  <span
    className={`inline-flex rounded-[999px] border px-[12px] py-[7px] font-diatype text-[11px] uppercase tracking-m3p ${adminToneMap[label]}`}
  >
    {label}
  </span>
);

export const adminInputClasses =
  'theme-input-field w-full rounded-[18px] px-[14px] py-[12px] font-diatype text-[13px] tracking-m3p';

export const adminLabelClasses =
  'theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p';

export const AdminButton: React.FC<{
  type?: 'button' | 'submit';
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}> = ({ type = 'button', children, onClick, variant = 'primary' }) => (
  <button
    type={type}
    onClick={onClick}
    className={`inline-flex rounded-[999px] px-[16px] py-[11px] font-diatype text-[11px] uppercase tracking-m3p transition ${
      variant === 'primary'
        ? 'theme-primary-button'
        : 'theme-secondary-button'
    }`}
  >
    {children}
  </button>
);

export const formatAdminDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export const formatAdminDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
