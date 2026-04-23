import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import React, { useMemo, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import {
  AdminButton,
  AdminPanel,
  AdminPill,
  adminInputClasses,
  adminLabelClasses,
  formatAdminDateTime,
} from '../../components/admin/shared';
import { listAccounts, type StoredAccount } from '../../lib/accounts';
import { requireAdminPageAccess } from '../../lib/auth-guards';
import { useAdminMutation } from '../../hooks/useAdminMutation';
import { readPlatformData } from '../../lib/platform-store';
import { listLatestWorkspaceViews } from '../../lib/workspace-store';
import type { ClientRecord, ProjectRecord } from '../../lib/workspace-data';

interface ClientsPageProps {
  clients: ClientRecord[];
  projects: ProjectRecord[];
  accounts: StoredAccount[];
  latestViews: Awaited<ReturnType<typeof listLatestWorkspaceViews>>;
}

const initialClientUserState = {
  companyName: '',
  contactName: '',
  email: '',
  password: 'MirrorProgressClient123!',
  assignedProjectIds: '',
  status: 'invited',
  inviteStatus: 'ready_to_send',
};

const ClientsPage: React.FC<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ clients, projects, accounts, latestViews }: ClientsPageProps) => {
  const [query, setQuery] = useState('');
  const [newClientUser, setNewClientUser] = useState(initialClientUserState);
  const { error, isSubmitting, runMutation } = useAdminMutation();

  const clientAccounts = accounts.filter((account) => account.role === 'client');
  const filteredAccounts = useMemo(
    () =>
      clientAccounts.filter(
        (account) =>
          account.name.toLowerCase().includes(query.toLowerCase()) ||
          account.email.toLowerCase().includes(query.toLowerCase()) ||
          account.company.toLowerCase().includes(query.toLowerCase())
      ),
    [clientAccounts, query]
  );

  const handleCreateClientUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await runMutation(
      {
        action: 'createClientUser',
        ...newClientUser,
      },
      {
        refresh: true,
        onSuccess: () => {
          setNewClientUser(initialClientUserState);
        },
      }
    );

    return result;
  };

  const handleUpdateAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    await runMutation({
      action: 'updateClientAccess',
      ...payload,
    });
  };

  return (
    <AdminShell
      title="Clients"
      description="Manage client accounts, assignment, last login signals, and workspace access state."
    >
      <div className="grid gap-[16px] xl:grid-cols-[1.15fr_0.95fr]">
        <AdminPanel
          title="Client accounts"
          description="Review account status, invite state, project access, and recent activity signals."
        >
          <div className="mb-[12px]">
            <input
              type="text"
              placeholder="Search client accounts"
              className={adminInputClasses}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="grid gap-[12px]">
            {filteredAccounts.map((account) => {
              const latestView = latestViews.find((view) => view.userId === account.id);
              const assignedProjects = projects.filter((project) =>
                account.assignedProjectIds.includes(project.id)
              );

              return (
                <form
                  key={account.id}
                  className="theme-card rounded-[24px] p-[16px]"
                  onSubmit={handleUpdateAccess}
                >
                  <input type="hidden" name="accountId" value={account.id} />
                  <input type="hidden" name="clientId" value={account.clientId ?? ''} />
                  <div className="flex flex-wrap items-start justify-between gap-[10px]">
                    <div>
                      <p className="font-dmSans text-[20px] font-light leading-110">
                        {account.name}
                      </p>
                      <p className="theme-page-muted mt-[6px] font-dmSans text-[14px] leading-120">
                        {account.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-[8px]">
                      <AdminPill label={account.status} />
                    </div>
                  </div>
                  <div className="mt-[12px] grid gap-[12px] md:grid-cols-2">
                    <div className="flex flex-col gap-[8px]">
                      <label className={adminLabelClasses}>Company</label>
                      <input name="company" defaultValue={account.company} className={adminInputClasses} />
                    </div>
                    <div className="flex flex-col gap-[8px]">
                      <label className={adminLabelClasses}>Name</label>
                      <input name="name" defaultValue={account.name} className={adminInputClasses} />
                    </div>
                  </div>
                  <div className="mt-[12px] grid gap-[12px] md:grid-cols-3">
                    <div className="flex flex-col gap-[8px]">
                      <label className={adminLabelClasses}>Role</label>
                      <select name="role" defaultValue={account.role} className={adminInputClasses}>
                        <option value="client">client</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-[8px]">
                      <label className={adminLabelClasses}>Account Status</label>
                      <select name="status" defaultValue={account.status} className={adminInputClasses}>
                        <option value="active">active</option>
                        <option value="invited">invited</option>
                        <option value="disabled">disabled</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-[8px]">
                      <label className={adminLabelClasses}>Invite State</label>
                      <select name="inviteStatus" defaultValue={account.inviteStatus} className={adminInputClasses}>
                        <option value="ready_to_send">ready_to_send</option>
                        <option value="sent">sent</option>
                        <option value="accepted">accepted</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-[12px] flex flex-col gap-[8px]">
                    <label className={adminLabelClasses}>Assigned Project</label>
                    <select
                      name="assignedProjectIds"
                      defaultValue={account.assignedProjectIds[0] ?? ''}
                      className={adminInputClasses}
                    >
                      <option value="">No project assigned</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.projectName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="theme-page-subtle mt-[12px] font-dmSans text-[13px] leading-120">
                    Last login {account.lastLoginAt ? formatAdminDateTime(account.lastLoginAt) : 'Not recorded'}
                  </p>
                  <p className="theme-page-subtle mt-[4px] font-dmSans text-[13px] leading-120">
                    Last viewed {latestView?.latestViewedAt ? formatAdminDateTime(latestView.latestViewedAt) : 'Not recorded'}
                  </p>
                  <p className="theme-page-subtle mt-[4px] font-dmSans text-[13px] leading-120">
                    Project access {assignedProjects.length ? assignedProjects.map((project) => project.projectName).join(', ') : 'Not assigned'}
                  </p>
                  <div className="mt-[12px] flex justify-end">
                    <AdminButton type="submit" variant="secondary">
                      Save Access
                    </AdminButton>
                  </div>
                </form>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Create client access"
          description="Create a new client record and account together. This is a lightweight alternative to a full invitation system."
        >
          <form
            id="create-client"
            className="grid gap-[12px]"
            onSubmit={handleCreateClientUser}
          >
            <div className="grid gap-[12px] md:grid-cols-2">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Company Name</label>
                <input
                  required
                  className={adminInputClasses}
                  value={newClientUser.companyName}
                  onChange={(event) =>
                    setNewClientUser((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Contact Name</label>
                <input
                  required
                  className={adminInputClasses}
                  value={newClientUser.contactName}
                  onChange={(event) =>
                    setNewClientUser((current) => ({
                      ...current,
                      contactName: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-[12px] md:grid-cols-2">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Email</label>
                <input
                  required
                  type="email"
                  className={adminInputClasses}
                  value={newClientUser.email}
                  onChange={(event) =>
                    setNewClientUser((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Temporary Password</label>
                <input
                  required
                  className={adminInputClasses}
                  value={newClientUser.password}
                  onChange={(event) =>
                    setNewClientUser((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-[12px] md:grid-cols-2">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Assigned Project</label>
                <select
                  className={adminInputClasses}
                  value={newClientUser.assignedProjectIds}
                  onChange={(event) =>
                    setNewClientUser((current) => ({
                      ...current,
                      assignedProjectIds: event.target.value,
                    }))
                  }
                >
                  <option value="">No project assigned</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Invite State</label>
                <select
                  className={adminInputClasses}
                  value={newClientUser.inviteStatus}
                  onChange={(event) =>
                    setNewClientUser((current) => ({
                      ...current,
                      inviteStatus: event.target.value,
                    }))
                  }
                >
                  <option value="ready_to_send">ready_to_send</option>
                  <option value="sent">sent</option>
                  <option value="accepted">accepted</option>
                </select>
              </div>
            </div>
            <div className="grid gap-[12px] md:grid-cols-2">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Account Status</label>
                <select
                  className={adminInputClasses}
                  value={newClientUser.status}
                  onChange={(event) =>
                    setNewClientUser((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="invited">invited</option>
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </select>
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Known Clients</label>
                <div className="theme-input-field theme-page-muted rounded-[18px] px-[14px] py-[12px] font-dmSans text-[13px] leading-120">
                  {clients.length} client records
                </div>
              </div>
            </div>

            {error ? (
              <p className="font-diatype text-[11px] uppercase tracking-m3p text-[#FF9500]">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <AdminButton type="submit">
                {isSubmitting ? 'Creating…' : 'Create Client Access'}
              </AdminButton>
            </div>
          </form>
        </AdminPanel>
      </div>
    </AdminShell>
  );
};

export const getServerSideProps: GetServerSideProps<ClientsPageProps> = async (
  context
) => {
  const access = await requireAdminPageAccess<ClientsPageProps>(context);

  if (access.redirect) {
    return access.redirect;
  }

  const data = await readPlatformData();
  const accounts = await listAccounts();

  return {
    props: {
      clients: data.clients,
      projects: data.projects,
      accounts,
      latestViews: await listLatestWorkspaceViews(),
    },
  };
};

export default ClientsPage;
