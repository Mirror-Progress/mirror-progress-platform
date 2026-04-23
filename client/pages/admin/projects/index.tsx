import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import AdminShell from '../../../components/admin/AdminShell';
import {
  AdminButton,
  AdminPanel,
  AdminPill,
  adminInputClasses,
  adminLabelClasses,
  formatAdminDateTime,
} from '../../../components/admin/shared';
import { listAccounts } from '../../../lib/accounts';
import {
  buildProjectDirectoryRows,
  type ProjectDirectoryRow,
} from '../../../lib/admin-view';
import { requireAdminPageAccess } from '../../../lib/auth-guards';
import { useAdminMutation } from '../../../hooks/useAdminMutation';
import { readPlatformData } from '../../../lib/platform-store';
import type { ClientRecord, ProjectHealth, ProjectStatus } from '../../../lib/workspace-data';

interface ProjectsPageProps {
  rows: ProjectDirectoryRow[];
  clients: ClientRecord[];
  leads: string[];
}

const initialProjectState = {
  projectName: '',
  clientId: '',
  description: '',
  status: 'In Progress' as ProjectStatus,
  phase: 'Discovery',
  health: 'On Track' as ProjectHealth,
  startDate: '2026-04-22',
  targetCompletionDate: '2026-05-22',
  internalLead: '',
  primaryClientContact: '',
};

const ProjectsPage: React.FC<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ rows, clients, leads }: ProjectsPageProps) => {
  const [filters, setFilters] = useState({
    query: '',
    status: 'all',
    client: 'all',
    lead: 'all',
    phase: 'all',
    overdueOnly: false,
  });
  const [newProject, setNewProject] = useState(initialProjectState);
  const { error, isSubmitting, runMutation } = useAdminMutation();

  const phases = [...new Set(rows.map(({ project }) => project.phase))];

  const filteredRows = useMemo(() => {
    return rows.filter(({ project, client, overdueItemCount }) => {
      const matchesQuery =
        filters.query === '' ||
        project.projectName.toLowerCase().includes(filters.query.toLowerCase()) ||
        (client?.companyName ?? '').toLowerCase().includes(filters.query.toLowerCase());
      const matchesStatus =
        filters.status === 'all' || project.status === filters.status;
      const matchesClient =
        filters.client === 'all' || client?.id === filters.client;
      const matchesLead =
        filters.lead === 'all' || project.internalLead === filters.lead;
      const matchesPhase =
        filters.phase === 'all' || project.phase === filters.phase;
      const matchesOverdue = !filters.overdueOnly || overdueItemCount > 0;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesClient &&
        matchesLead &&
        matchesPhase &&
        matchesOverdue
      );
    });
  }, [filters, rows]);

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await runMutation<{ projectId: string }>(
      {
        action: 'createProject',
        ...newProject,
      },
      {
        refresh: false,
        onSuccess: async (data) => {
          setNewProject(initialProjectState);
          window.location.href = `/admin/projects/${data.projectId}`;
        },
      }
    );

    return result;
  };

  return (
    <AdminShell
      title="Projects"
      description="Track every active client project, filter by operational state, and move directly into the project record when updates are needed."
    >
      <AdminPanel
        title="Project filters"
        description="Search the full project set by status, client, lead, phase, or overdue work."
      >
        <div className="grid gap-[12px] md:grid-cols-2 xl:grid-cols-6">
          <input
            type="text"
            placeholder="Search projects or clients"
            className={adminInputClasses}
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
          />
          <select
            className={adminInputClasses}
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="all">All statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Client Response">Awaiting Client Response</option>
            <option value="Delayed">Delayed</option>
            <option value="Complete">Complete</option>
          </select>
          <select
            className={adminInputClasses}
            value={filters.client}
            onChange={(event) =>
              setFilters((current) => ({ ...current, client: event.target.value }))
            }
          >
            <option value="all">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
          <select
            className={adminInputClasses}
            value={filters.lead}
            onChange={(event) =>
              setFilters((current) => ({ ...current, lead: event.target.value }))
            }
          >
            <option value="all">All leads</option>
            {leads.map((lead) => (
              <option key={lead} value={lead}>
                {lead}
              </option>
            ))}
          </select>
          <select
            className={adminInputClasses}
            value={filters.phase}
            onChange={(event) =>
              setFilters((current) => ({ ...current, phase: event.target.value }))
            }
          >
            <option value="all">All phases</option>
            {phases.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
          <label className="theme-input-field theme-page-muted flex items-center gap-[10px] rounded-[18px] px-[14px] py-[12px] font-diatype text-[11px] uppercase tracking-m3p">
            <input
              type="checkbox"
              checked={filters.overdueOnly}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  overdueOnly: event.target.checked,
                }))
              }
            />
            Overdue only
          </label>
        </div>
      </AdminPanel>

      <div className="grid gap-[16px] xl:grid-cols-[1.25fr_0.95fr]">
        <AdminPanel
          title="Projects directory"
          description="A single operational list of projects, current phase, next milestone, and assigned lead."
        >
          <div className="grid gap-[12px]">
            {filteredRows.map(({ project, client, nextMilestone, overdueItemCount }) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="theme-card theme-card-interactive rounded-[24px] px-[16px] py-[14px] transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div className="min-w-0">
                    <p className="font-dmSans text-[21px] font-light leading-110">
                      {project.projectName}
                    </p>
                    <p className="theme-page-muted mt-[6px] font-dmSans text-[14px] leading-120">
                      {client?.companyName ?? 'Unknown client'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-[8px]">
                    <AdminPill label={project.status} />
                    <AdminPill label={project.health} />
                  </div>
                </div>
                <div className="mt-[14px] grid gap-[8px] md:grid-cols-4">
                  <div>
                    <p className={adminLabelClasses}>Current Phase</p>
                    <p className="theme-page-muted mt-[6px] font-dmSans text-[14px] leading-120">
                      {project.phase}
                    </p>
                  </div>
                  <div>
                    <p className={adminLabelClasses}>Next Milestone</p>
                    <p className="theme-page-muted mt-[6px] font-dmSans text-[14px] leading-120">
                      {nextMilestone?.title ?? 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className={adminLabelClasses}>Assigned Lead</p>
                    <p className="theme-page-muted mt-[6px] font-dmSans text-[14px] leading-120">
                      {project.internalLead}
                    </p>
                  </div>
                  <div>
                    <p className={adminLabelClasses}>Last Updated</p>
                    <p className="theme-page-muted mt-[6px] font-dmSans text-[14px] leading-120">
                      {formatAdminDateTime(project.lastUpdated)}
                    </p>
                  </div>
                </div>
                <p className="theme-page-subtle mt-[12px] font-dmSans text-[14px] leading-120">
                  Overdue items: {overdueItemCount}
                </p>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Create project"
          description="Start a new project record with the minimum fields needed to make the dashboard immediately useful."
        >
          <form
            id="create-project"
            className="grid gap-[12px]"
            onSubmit={handleCreateProject}
          >
            <div className="grid gap-[12px] md:grid-cols-2">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Project Name</label>
                <input
                  required
                  className={adminInputClasses}
                  value={newProject.projectName}
                  onChange={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      projectName: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Client</label>
                <select
                  required
                  className={adminInputClasses}
                  value={newProject.clientId}
                  onChange={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      clientId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className={adminLabelClasses}>Description</label>
              <textarea
                required
                rows={4}
                className={adminInputClasses}
                value={newProject.description}
                onChange={(event) =>
                  setNewProject((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-[12px] md:grid-cols-2">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Project Status</label>
                <select
                  className={adminInputClasses}
                  value={newProject.status}
                  onChange={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      status: event.target.value as ProjectStatus,
                    }))
                  }
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Client Response">Awaiting Client Response</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Health Indicator</label>
                <select
                  className={adminInputClasses}
                  value={newProject.health}
                  onChange={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      health: event.target.value as ProjectHealth,
                    }))
                  }
                >
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Awaiting Client">Awaiting Client</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
            </div>

            <div className="grid gap-[12px] md:grid-cols-2">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Current Phase</label>
                <input
                  className={adminInputClasses}
                  value={newProject.phase}
                  onChange={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      phase: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Assigned Lead</label>
                <select
                  className={adminInputClasses}
                  value={newProject.internalLead}
                  onChange={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      internalLead: event.target.value,
                    }))
                  }
                >
                  <option value="">Select lead</option>
                  {leads.map((lead) => (
                    <option key={lead} value={lead}>
                      {lead}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-[12px] md:grid-cols-2">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Start Date</label>
                <input
                  type="date"
                  className={adminInputClasses}
                  value={newProject.startDate}
                  onChange={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Target Completion</label>
                <input
                  type="date"
                  className={adminInputClasses}
                  value={newProject.targetCompletionDate}
                  onChange={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      targetCompletionDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className={adminLabelClasses}>Primary Client Contact</label>
              <input
                className={adminInputClasses}
                value={newProject.primaryClientContact}
                onChange={(event) =>
                  setNewProject((current) => ({
                    ...current,
                    primaryClientContact: event.target.value,
                  }))
                }
              />
            </div>

            {error ? (
              <p className="font-diatype text-[11px] uppercase tracking-m3p text-[#FF9500]">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <AdminButton type="submit">
                {isSubmitting ? 'Creating…' : 'Create Project'}
              </AdminButton>
            </div>
          </form>
        </AdminPanel>
      </div>
    </AdminShell>
  );
};

export const getServerSideProps: GetServerSideProps<ProjectsPageProps> = async (
  context
) => {
  const access = await requireAdminPageAccess<ProjectsPageProps>(context);

  if (access.redirect) {
    return access.redirect;
  }

  const data = await readPlatformData();
  const accounts = await listAccounts();

  return {
    props: {
      rows: buildProjectDirectoryRows(data),
      clients: data.clients,
      leads: accounts
        .filter((account) => account.role === 'project_lead' || account.role === 'admin' || account.role === 'super_admin')
        .map((account) => account.name),
    },
  };
};

export default ProjectsPage;
