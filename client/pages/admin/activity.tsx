import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import React from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { AdminPanel, formatAdminDateTime } from '../../components/admin/shared';
import { getRecentActivity } from '../../lib/admin-view';
import { requireAdminPageAccess } from '../../lib/auth-guards';
import { readPlatformData } from '../../lib/platform-store';

interface ActivityPageProps {
  activity: ReturnType<typeof getRecentActivity>;
}

const ActivityPage: React.FC<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ activity }: ActivityPageProps) => {
  return (
    <AdminShell
      title="Activity"
      description="A lightweight audit log of project changes, milestone updates, access changes, and status movements across the platform."
    >
      <AdminPanel
        title="Activity log"
        description="Each entry records what changed, when it changed, and who made the change where available."
      >
        <div className="grid gap-[12px]">
          {activity.map((entry) => (
            <div
              key={entry.id}
              className="theme-card rounded-[24px] px-[16px] py-[14px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-[12px]">
                <p className="font-dmSans text-[17px] leading-120 text-[color:var(--theme-page-text)]">
                  {entry.message}
                </p>
                <span className="theme-eyebrow font-diatype text-[11px] uppercase tracking-m3p">
                  {entry.type}
                </span>
              </div>
              <p className="theme-page-subtle mt-[8px] font-dmSans text-[13px] leading-120">
                {entry.actorLabel} · {formatAdminDateTime(entry.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </AdminPanel>
    </AdminShell>
  );
};

export const getServerSideProps: GetServerSideProps<ActivityPageProps> = async (
  context
) => {
  const access = await requireAdminPageAccess<ActivityPageProps>(context);

  if (access.redirect) {
    return access.redirect;
  }

  const data = await readPlatformData();

  return {
    props: {
      activity: getRecentActivity(data),
    },
  };
};

export default ActivityPage;
