import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import React from 'react';
import AdminShell from '../../../components/admin/AdminShell';
import {
  AdminButton,
  AdminPanel,
  AdminPill,
  adminInputClasses,
  adminLabelClasses,
  formatAdminDate,
  formatAdminDateTime,
} from '../../../components/admin/shared';
import { listAccounts } from '../../../lib/accounts';
import { findProjectActivity } from '../../../lib/admin-view';
import { requireAdminPageAccess } from '../../../lib/auth-guards';
import { useAdminMutation } from '../../../hooks/useAdminMutation';
import { findProjectById, readPlatformData } from '../../../lib/platform-store';
import type {
  ActionItemRecord,
  ClientRecord,
  DecisionRecord,
  MilestoneRecord,
  ProjectRecord,
  ResourceRecord,
} from '../../../lib/workspace-data';

interface ProjectDetailPageProps {
  project: ProjectRecord;
  client: ClientRecord | null;
  clients: ClientRecord[];
  milestones: MilestoneRecord[];
  decisions: DecisionRecord[];
  actionItems: ActionItemRecord[];
  resources: ResourceRecord[];
  activity: ReturnType<typeof findProjectActivity>;
  leads: string[];
  clientAccounts: Awaited<ReturnType<typeof listAccounts>>;
}

function formToPayload(form: HTMLFormElement) {
  const entries = new FormData(form).entries();
  return Object.fromEntries(entries);
}

const ProjectDetailPage: React.FC<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({
  project,
  client,
  clients,
  milestones,
  decisions,
  actionItems,
  resources,
  activity,
  leads,
  clientAccounts,
}: ProjectDetailPageProps) => {
  const { error, isSubmitting, runMutation, clearError } = useAdminMutation();

  const submitProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    await runMutation({
      action: 'updateProject',
      id: project.id,
      ...formToPayload(event.currentTarget),
    });
  };

  const submitMilestone = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    await runMutation({
      action: 'saveMilestone',
      projectId: project.id,
      ...formToPayload(event.currentTarget),
    });
  };

  const submitDecision = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    await runMutation({
      action: 'saveDecision',
      projectId: project.id,
      ...formToPayload(event.currentTarget),
    });
  };

  const submitActionItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    await runMutation({
      action: 'saveActionItem',
      projectId: project.id,
      ...formToPayload(event.currentTarget),
    });
  };

  const submitResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    await runMutation({
      action: 'saveResource',
      projectId: project.id,
      addedAt: new Date().toISOString(),
      ...formToPayload(event.currentTarget),
    });
  };

  const submitClientAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    await runMutation({
      action: 'updateClientAccess',
      ...formToPayload(event.currentTarget),
      assignedProjectIds: project.id,
    });
  };

  const submitClientRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    await runMutation({
      action: 'updateClientRecord',
      clientId: client?.id,
      ...formToPayload(event.currentTarget),
    });
  };

  return (
    <AdminShell
      title={project.projectName}
      description="Review, update, and maintain the project record that drives the client-facing workspace."
    >
      {error ? (
        <div className="rounded-[24px] border border-[#A86161]/25 bg-[#332222] px-[16px] py-[14px] font-diatype text-[11px] uppercase tracking-m3p text-[#F2C6C6]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-[16px] xl:grid-cols-[1.05fr_0.95fr]">
        <AdminPanel
          title="Overview"
          description="Edit the core project fields, current phase, health, and internal notes."
        >
          <form className="grid gap-[12px]" onSubmit={submitProject}>
            <div className="grid gap-[12px] md:grid-cols-2">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Project Name</label>
                <input
                  name="projectName"
                  defaultValue={project.projectName}
                  className={adminInputClasses}
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Client</label>
                <select
                  name="clientId"
                  defaultValue={project.clientId}
                  className={adminInputClasses}
                >
                  {clients.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className={adminLabelClasses}>Description</label>
              <textarea
                name="description"
                rows={4}
                defaultValue={project.description}
                className={adminInputClasses}
              />
            </div>

            <div className="grid gap-[12px] md:grid-cols-3">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Project Status</label>
                <select
                  name="status"
                  defaultValue={project.status}
                  className={adminInputClasses}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Client Response">Awaiting Client Response</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Current Phase</label>
                <input
                  name="phase"
                  defaultValue={project.phase}
                  className={adminInputClasses}
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Health</label>
                <select
                  name="health"
                  defaultValue={project.health}
                  className={adminInputClasses}
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
                <label className={adminLabelClasses}>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={project.startDate}
                  className={adminInputClasses}
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Target Completion Date</label>
                <input
                  type="date"
                  name="targetCompletionDate"
                  defaultValue={project.targetCompletionDate}
                  className={adminInputClasses}
                />
              </div>
            </div>

            <div className="grid gap-[12px] md:grid-cols-3">
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Internal Lead</label>
                <select
                  name="internalLead"
                  defaultValue={project.internalLead}
                  className={adminInputClasses}
                >
                  {leads.map((lead) => (
                    <option key={lead} value={lead}>
                      {lead}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Primary Client Contact</label>
                <input
                  name="primaryClientContact"
                  defaultValue={project.primaryClientContact}
                  className={adminInputClasses}
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Progress Percent</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  name="progressPercent"
                  defaultValue={project.progressPercent}
                  className={adminInputClasses}
                />
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className={adminLabelClasses}>Next Milestone</label>
              <select
                name="nextMilestoneId"
                defaultValue={project.nextMilestoneId}
                className={adminInputClasses}
              >
                <option value="">Select next milestone</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className={adminLabelClasses}>Internal Notes</label>
              <textarea
                name="internalNotes"
                rows={5}
                defaultValue={project.internalNotes}
                className={adminInputClasses}
              />
              <p className="theme-page-subtle font-dmSans text-[13px] leading-120">
                Internal notes are stored in the project record but do not render in the client workspace.
              </p>
            </div>

            <div className="flex justify-end">
              <AdminButton type="submit">
                {isSubmitting ? 'Saving…' : 'Save Project'}
              </AdminButton>
            </div>
          </form>
        </AdminPanel>

        <AdminPanel
          title="Client access"
          description="Manage the linked client record and account access tied to this project."
        >
          {client ? (
            <form className="grid gap-[12px]" onSubmit={submitClientRecord}>
              <div className="grid gap-[12px] md:grid-cols-2">
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Company Name</label>
                  <input
                    name="companyName"
                    defaultValue={client.companyName}
                    className={adminInputClasses}
                  />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Primary Contact</label>
                  <input
                    name="primaryContact"
                    defaultValue={client.primaryContact}
                    className={adminInputClasses}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Email</label>
                <input
                  name="email"
                  defaultValue={client.email}
                  className={adminInputClasses}
                />
              </div>
              <div className="flex justify-end">
                <AdminButton type="submit">Save Client Record</AdminButton>
              </div>
            </form>
          ) : null}

          <div className="grid gap-[12px]">
            {clientAccounts.map((account) => (
              <form
                key={account.id}
                className="theme-card rounded-[24px] p-[16px]"
                onSubmit={submitClientAccess}
              >
                <input type="hidden" name="accountId" value={account.id} />
                <div className="grid gap-[12px] md:grid-cols-2">
                  <div className="flex flex-col gap-[8px]">
                    <label className={adminLabelClasses}>Contact Name</label>
                    <input
                      name="name"
                      defaultValue={account.name}
                      className={adminInputClasses}
                    />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className={adminLabelClasses}>Company</label>
                    <input
                      name="company"
                      defaultValue={account.company}
                      className={adminInputClasses}
                    />
                  </div>
                </div>
                <div className="mt-[12px] grid gap-[12px] md:grid-cols-3">
                  <div className="flex flex-col gap-[8px]">
                    <label className={adminLabelClasses}>Role</label>
                    <select
                      name="role"
                      defaultValue={account.role}
                      className={adminInputClasses}
                    >
                      <option value="client">client</option>
                      <option value="project_lead">project_lead</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className={adminLabelClasses}>Account Status</label>
                    <select
                      name="status"
                      defaultValue={account.status}
                      className={adminInputClasses}
                    >
                      <option value="active">active</option>
                      <option value="invited">invited</option>
                      <option value="disabled">disabled</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className={adminLabelClasses}>Invite State</label>
                    <select
                      name="inviteStatus"
                      defaultValue={account.inviteStatus}
                      className={adminInputClasses}
                    >
                      <option value="ready_to_send">ready_to_send</option>
                      <option value="sent">sent</option>
                      <option value="accepted">accepted</option>
                    </select>
                  </div>
                </div>
                <input type="hidden" name="clientId" value={client?.id ?? ''} />
                <div className="mt-[12px] flex items-center justify-between gap-[12px]">
                  <div className="flex flex-wrap gap-[8px]">
                    <AdminPill label={account.status} />
                  </div>
                  <AdminButton type="submit" variant="secondary">
                    Save Access
                  </AdminButton>
                </div>
              </form>
            ))}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel
        title="Milestones"
        description="Maintain the project timeline, client-visible summaries, and internal-only milestone notes."
      >
        <div className="grid gap-[16px]">
          {milestones.map((milestone) => (
            <form
              key={milestone.id}
              className="theme-card rounded-[24px] p-[16px]"
              onSubmit={submitMilestone}
            >
              <input type="hidden" name="id" value={milestone.id} />
              <input
                type="hidden"
                name="clientVisible"
                value={milestone.clientVisible ? 'true' : ''}
              />
              <div className="grid gap-[12px] md:grid-cols-3">
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Title</label>
                  <input name="title" defaultValue={milestone.title} className={adminInputClasses} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Stage Label</label>
                  <input
                    name="stageLabel"
                    defaultValue={milestone.stageLabel}
                    className={adminInputClasses}
                  />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Status</label>
                  <select
                    name="status"
                    defaultValue={milestone.status}
                    className={adminInputClasses}
                  >
                    <option value="Complete">Complete</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Awaiting Client">Awaiting Client</option>
                    <option value="Upcoming">Upcoming</option>
                  </select>
                </div>
              </div>
              <div className="mt-[12px] grid gap-[12px] md:grid-cols-2">
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Date</label>
                  <input type="date" name="date" defaultValue={milestone.date} className={adminInputClasses} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Due Date</label>
                  <input type="date" name="dueDate" defaultValue={milestone.dueDate} className={adminInputClasses} />
                </div>
              </div>
              <div className="mt-[12px] grid gap-[12px] md:grid-cols-2">
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Summary</label>
                  <textarea name="summary" rows={3} defaultValue={milestone.summary} className={adminInputClasses} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Detailed Notes</label>
                  <textarea name="details" rows={3} defaultValue={milestone.details} className={adminInputClasses} />
                </div>
              </div>
              <div className="mt-[12px] grid gap-[12px] md:grid-cols-3">
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Decisions</label>
                  <textarea
                    name="decisions"
                    rows={4}
                    defaultValue={milestone.decisions.join('\n')}
                    className={adminInputClasses}
                  />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Client Action Items</label>
                  <textarea
                    name="clientActionItems"
                    rows={4}
                    defaultValue={milestone.clientActionItems.join('\n')}
                    className={adminInputClasses}
                  />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Mirror Progress Action Items</label>
                  <textarea
                    name="internalActionItems"
                    rows={4}
                    defaultValue={milestone.internalActionItems.join('\n')}
                    className={adminInputClasses}
                  />
                </div>
              </div>
              <div className="mt-[12px] grid gap-[12px] md:grid-cols-2">
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Owner</label>
                  <input name="owner" defaultValue={milestone.owner} className={adminInputClasses} />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className={adminLabelClasses}>Attachment Ids</label>
                  <input
                    name="attachmentIds"
                    defaultValue={milestone.attachmentIds.join(', ')}
                    className={adminInputClasses}
                  />
                </div>
              </div>
              <div className="mt-[12px] flex flex-col gap-[8px]">
                <label className={adminLabelClasses}>Internal Notes</label>
                <textarea
                  name="internalNotes"
                  rows={4}
                  defaultValue={milestone.internalNotes}
                  className={adminInputClasses}
                />
              </div>
              <div className="mt-[12px] flex justify-end">
                <AdminButton type="submit" variant="secondary">
                  Save Milestone
                </AdminButton>
              </div>
            </form>
          ))}

          <form className="rounded-[24px] border border-dashed border-[color:var(--theme-border)] p-[16px]" onSubmit={submitMilestone}>
            <input type="hidden" name="clientVisible" value="true" />
            <div className="grid gap-[12px] md:grid-cols-3">
              <input name="title" placeholder="New milestone title" className={adminInputClasses} />
              <input name="stageLabel" placeholder="Stage label" className={adminInputClasses} />
              <select name="status" defaultValue="Upcoming" className={adminInputClasses}>
                <option value="Upcoming">Upcoming</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Client">Awaiting Client</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            <div className="mt-[12px] flex justify-end">
              <AdminButton type="submit">Add Milestone</AdminButton>
            </div>
          </form>
        </div>
      </AdminPanel>

      <div className="grid gap-[16px] xl:grid-cols-[1fr_1fr]">
        <AdminPanel
          title="Decisions"
          description="Maintain confirmed decisions that appear in the project record."
        >
          <div className="grid gap-[12px]">
            {decisions.map((decision) => (
              <form
                key={decision.id}
                className="theme-card rounded-[24px] p-[16px]"
                onSubmit={submitDecision}
              >
                <input type="hidden" name="id" value={decision.id} />
                <input type="hidden" name="clientVisible" value={decision.clientVisible ? 'true' : ''} />
                <div className="grid gap-[12px] md:grid-cols-2">
                  <input name="decision" defaultValue={decision.decision} className={adminInputClasses} />
                  <input name="madeBy" defaultValue={decision.madeBy} className={adminInputClasses} />
                </div>
                <div className="mt-[12px] grid gap-[12px] md:grid-cols-2">
                  <input type="date" name="date" defaultValue={decision.date} className={adminInputClasses} />
                  <select
                    name="milestoneId"
                    defaultValue={decision.milestoneId ?? ''}
                    className={adminInputClasses}
                  >
                    <option value="">No linked milestone</option>
                    {milestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={decision.notes}
                  className={`${adminInputClasses} mt-[12px]`}
                />
                <div className="mt-[12px] flex justify-end">
                  <AdminButton type="submit" variant="secondary">
                    Save Decision
                  </AdminButton>
                </div>
              </form>
            ))}

            <form className="rounded-[24px] border border-dashed border-[color:var(--theme-border)] p-[16px]" onSubmit={submitDecision}>
              <input type="hidden" name="clientVisible" value="true" />
              <div className="grid gap-[12px]">
                <input name="decision" placeholder="Add a decision" className={adminInputClasses} />
                <input name="madeBy" placeholder="Made by" className={adminInputClasses} />
                <textarea name="notes" rows={3} placeholder="Notes" className={adminInputClasses} />
              </div>
              <div className="mt-[12px] flex justify-end">
                <AdminButton type="submit">Add Decision</AdminButton>
              </div>
            </form>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Action items"
          description="Track ownership, due dates, visibility, and current status."
        >
          <div className="grid gap-[12px]">
            {actionItems.map((item) => (
              <form
                key={item.id}
                className="theme-card rounded-[24px] p-[16px]"
                onSubmit={submitActionItem}
              >
                <input type="hidden" name="id" value={item.id} />
                <div className="grid gap-[12px]">
                  <input name="description" defaultValue={item.description} className={adminInputClasses} />
                  <div className="grid gap-[12px] md:grid-cols-4">
                    <input name="assignedTo" defaultValue={item.assignedTo} className={adminInputClasses} />
                    <select name="ownerType" defaultValue={item.ownerType} className={adminInputClasses}>
                      <option value="Client">Client</option>
                      <option value="Mirror Progress">Mirror Progress</option>
                    </select>
                    <input type="date" name="dueDate" defaultValue={item.dueDate} className={adminInputClasses} />
                    <select name="status" defaultValue={item.status} className={adminInputClasses}>
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Awaiting Client">Awaiting Client</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Complete">Complete</option>
                    </select>
                  </div>
                  <div className="grid gap-[12px] md:grid-cols-2">
                    <select
                      name="relatedMilestoneId"
                      defaultValue={item.relatedMilestoneId ?? ''}
                      className={adminInputClasses}
                    >
                      <option value="">No linked milestone</option>
                      {milestones.map((milestone) => (
                        <option key={milestone.id} value={milestone.id}>
                          {milestone.title}
                        </option>
                      ))}
                    </select>
                    <label className="theme-input-field theme-page-muted flex items-center gap-[10px] rounded-[18px] px-[14px] py-[12px] font-diatype text-[11px] uppercase tracking-m3p">
                      <input
                        type="checkbox"
                        name="clientVisible"
                        defaultChecked={item.clientVisible}
                      />
                      Client visible
                    </label>
                  </div>
                </div>
                <div className="mt-[12px] flex justify-end">
                  <AdminButton type="submit" variant="secondary">
                    Save Action Item
                  </AdminButton>
                </div>
              </form>
            ))}

            <form className="rounded-[24px] border border-dashed border-[color:var(--theme-border)] p-[16px]" onSubmit={submitActionItem}>
              <div className="grid gap-[12px]">
                <input name="description" placeholder="New action item" className={adminInputClasses} />
                <div className="grid gap-[12px] md:grid-cols-4">
                  <input name="assignedTo" placeholder="Assigned to" className={adminInputClasses} />
                  <select name="ownerType" defaultValue="Client" className={adminInputClasses}>
                    <option value="Client">Client</option>
                    <option value="Mirror Progress">Mirror Progress</option>
                  </select>
                  <input type="date" name="dueDate" className={adminInputClasses} />
                  <select name="status" defaultValue="Not Started" className={adminInputClasses}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Awaiting Client">Awaiting Client</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
                <label className="theme-input-field theme-page-muted flex items-center gap-[10px] rounded-[18px] px-[14px] py-[12px] font-diatype text-[11px] uppercase tracking-m3p">
                  <input type="checkbox" name="clientVisible" defaultChecked />
                  Client visible
                </label>
              </div>
              <div className="mt-[12px] flex justify-end">
                <AdminButton type="submit">Add Action Item</AdminButton>
              </div>
            </form>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-[16px] xl:grid-cols-[0.9fr_1.1fr]">
        <AdminPanel
          title="Files / links"
          description="Maintain lightweight resource links referenced in the project record."
        >
          <div className="grid gap-[12px]">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="theme-card rounded-[24px] px-[16px] py-[14px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-[10px]">
                  <p className="font-dmSans text-[18px] font-light leading-110">
                    {resource.title}
                  </p>
                  <AdminPill label={resource.type} />
                </div>
                <p className="theme-page-muted mt-[8px] font-dmSans text-[14px] leading-120">
                  {resource.url}
                </p>
              </div>
            ))}

            <form className="rounded-[24px] border border-dashed border-[color:var(--theme-border)] p-[16px]" onSubmit={submitResource}>
              <div className="grid gap-[12px]">
                <input name="title" placeholder="Resource title" className={adminInputClasses} />
                <input name="url" placeholder="Resource URL" className={adminInputClasses} />
                <div className="grid gap-[12px] md:grid-cols-2">
                  <select name="type" defaultValue="Doc" className={adminInputClasses}>
                    <option value="Deck">Deck</option>
                    <option value="Doc">Doc</option>
                    <option value="Prototype">Prototype</option>
                    <option value="Deliverable">Deliverable</option>
                  </select>
                  <label className="theme-input-field theme-page-muted flex items-center gap-[10px] rounded-[18px] px-[14px] py-[12px] font-diatype text-[11px] uppercase tracking-m3p">
                    <input type="checkbox" name="clientVisible" defaultChecked />
                    Client visible
                  </label>
                </div>
              </div>
              <div className="mt-[12px] flex justify-end">
                <AdminButton type="submit">Add Resource</AdminButton>
              </div>
            </form>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Activity history"
          description="A running audit trail of project changes and access updates."
        >
          <div className="grid gap-[12px]">
            {activity.map((entry) => (
              <div
                key={entry.id}
                className="theme-card rounded-[24px] px-[16px] py-[14px]"
              >
                <p className="font-dmSans text-[16px] leading-120 text-[color:var(--theme-page-text)]">
                  {entry.message}
                </p>
                <p className="theme-page-subtle mt-[8px] font-dmSans text-[13px] leading-120">
                  {entry.actorLabel} · {formatAdminDateTime(entry.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
};

export const getServerSideProps: GetServerSideProps<ProjectDetailPageProps> = async (
  context
) => {
  const access = await requireAdminPageAccess<ProjectDetailPageProps>(context);

  if (access.redirect) {
    return access.redirect;
  }

  const projectId = `${context.params?.projectId ?? ''}`;
  const data = await readPlatformData();
  const project = findProjectById(data, projectId);

  if (!project) {
    return { notFound: true };
  }

  const accounts = await listAccounts();

  return {
    props: {
      project,
      client: data.clients.find((entry) => entry.id === project.clientId) ?? null,
      clients: data.clients,
      milestones: data.milestones.filter((milestone) => milestone.projectId === project.id),
      decisions: data.decisions.filter((decision) => decision.projectId === project.id),
      actionItems: data.actionItems.filter((actionItem) => actionItem.projectId === project.id),
      resources: data.resources.filter((resource) => resource.projectId === project.id),
      activity: findProjectActivity(data.activity, project.id),
      leads: accounts
        .filter((account) => account.role === 'project_lead' || account.role === 'admin' || account.role === 'super_admin')
        .map((account) => account.name),
      clientAccounts: accounts.filter(
        (account) =>
          account.clientId === project.clientId ||
          account.assignedProjectIds.includes(project.id)
      ),
    },
  };
};

export default ProjectDetailPage;
