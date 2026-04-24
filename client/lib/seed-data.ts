import type {
  ActionItemRecord,
  ActivityLogRecord,
  ClientRecord,
  DecisionRecord,
  InviteStatus,
  MilestoneRecord,
  PlatformDataRecord,
  ProjectRecord,
  ResourceRecord,
  UserRole,
  UserStatus,
} from './workspace-data';

export interface SeedAccountDefinition {
  id: string;
  name: string;
  email: string;
  company: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  clientId: string | null;
  assignedProjectIds: string[];
  inviteStatus: InviteStatus;
}

export const DEV_SEED_ACCOUNTS = [
  {
    email: 'admin@mirrorprogress.local',
    password: 'MirrorProgressAdmin123!',
    role: 'super_admin' as const,
  },
  {
    email: 'lead@mirrorprogress.local',
    password: 'MirrorProgressLead123!',
    role: 'project_lead' as const,
  },
  {
    email: 'sarah@horizonbiolabs.com',
    password: 'MirrorProgressClient123!',
    role: 'client' as const,
  },
];

export const seedCreatedAt = '2026-04-22T08:30:00.000Z';

export const seededAccountDefinitions: SeedAccountDefinition[] = [
  {
    id: 'user-admin-super',
    name: 'Avery Cole',
    email: 'admin@mirrorprogress.local',
    company: 'Mirror Progress',
    password: 'MirrorProgressAdmin123!',
    role: 'super_admin',
    status: 'active',
    clientId: null,
    assignedProjectIds: [],
    inviteStatus: 'accepted',
  },
  {
    id: 'user-project-lead',
    name: 'Jordan Lee',
    email: 'lead@mirrorprogress.local',
    company: 'Mirror Progress',
    password: 'MirrorProgressLead123!',
    role: 'project_lead',
    status: 'active',
    clientId: null,
    assignedProjectIds: ['project-horizon-refinement', 'project-atlas-ops'],
    inviteStatus: 'accepted',
  },
  {
    id: 'user-client-horizon',
    name: 'Sarah Bennett',
    email: 'sarah@horizonbiolabs.com',
    company: 'Horizon Biolabs',
    password: 'MirrorProgressClient123!',
    role: 'client',
    status: 'active',
    clientId: 'client-horizon-biolabs',
    assignedProjectIds: ['project-horizon-refinement'],
    inviteStatus: 'accepted',
  },
  {
    id: 'user-client-northline',
    name: 'Maya Chen',
    email: 'maya@northlineenergy.com',
    company: 'Northline Energy',
    password: 'MirrorProgressClient123!',
    role: 'client',
    status: 'active',
    clientId: 'client-northline-energy',
    assignedProjectIds: ['project-northline-launch'],
    inviteStatus: 'accepted',
  },
  {
    id: 'user-client-atlas',
    name: 'Elias Porter',
    email: 'elias@atlashealth.io',
    company: 'Atlas Health',
    password: 'MirrorProgressClient123!',
    role: 'client',
    status: 'active',
    clientId: 'client-atlas-health',
    assignedProjectIds: ['project-atlas-ops'],
    inviteStatus: 'accepted',
  },
];

export function createSeedPlatformData(): PlatformDataRecord {
  const clients: ClientRecord[] = [
    {
      id: 'client-horizon-biolabs',
      companyName: 'Horizon Biolabs',
      primaryContact: 'Sarah Bennett',
      email: 'sarah@horizonbiolabs.com',
    },
    {
      id: 'client-northline-energy',
      companyName: 'Northline Energy',
      primaryContact: 'Maya Chen',
      email: 'maya@northlineenergy.com',
    },
    {
      id: 'client-atlas-health',
      companyName: 'Atlas Health',
      primaryContact: 'Elias Porter',
      email: 'elias@atlashealth.io',
    },
    {
      id: 'client-aurelia-foundation',
      companyName: 'Aurelia Foundation',
      primaryContact: 'Clara Jensen',
      email: 'clara@aurelia.foundation',
    },
  ];

  const projects: ProjectRecord[] = [
    {
      id: 'project-horizon-refinement',
      clientId: 'client-horizon-biolabs',
      projectName: 'Horizon Biolabs Digital Platform Refinement',
      description:
        'Homepage and content refinement work to align stakeholder direction, review pacing, and delivery readiness.',
      status: 'In Progress',
      phase: 'Design Refinement',
      health: 'On Track',
      startDate: '2026-04-08',
      targetCompletionDate: '2026-05-20',
      internalLead: 'Jordan Lee',
      primaryClientContact: 'Sarah Bennett',
      progressPercent: 62,
      nextMilestoneId: 'milestone-horizon-homepage-review',
      lastUpdated: '2026-04-22T15:30:00.000Z',
      internalNotes:
        'Stakeholder alignment is strong. Delivery risk is currently low, but final content timing still affects the review deck lock.',
    },
    {
      id: 'project-northline-launch',
      clientId: 'client-northline-energy',
      projectName: 'Northline Energy Site Launch Planning',
      description:
        'Launch planning and content alignment for the next external release cycle.',
      status: 'Awaiting Client Response',
      phase: 'Content Alignment',
      health: 'Awaiting Client',
      startDate: '2026-03-28',
      targetCompletionDate: '2026-05-28',
      internalLead: 'Dana Mercer',
      primaryClientContact: 'Maya Chen',
      progressPercent: 48,
      nextMilestoneId: 'milestone-northline-materials',
      lastUpdated: '2026-04-21T18:00:00.000Z',
      internalNotes:
        'Timeline depends on stakeholder approvals and missing launch materials. Follow-up cadence should stay calm but consistent.',
    },
    {
      id: 'project-atlas-ops',
      clientId: 'client-atlas-health',
      projectName: 'Atlas Health Research Operations Workspace',
      description:
        'Operational planning for a structured research library and internal workflow handoff.',
      status: 'Delayed',
      phase: 'Implementation Planning',
      health: 'At Risk',
      startDate: '2026-03-10',
      targetCompletionDate: '2026-05-12',
      internalLead: 'Jordan Lee',
      primaryClientContact: 'Elias Porter',
      progressPercent: 54,
      nextMilestoneId: 'milestone-atlas-dependency-review',
      lastUpdated: '2026-04-20T11:15:00.000Z',
      internalNotes:
        'Delivery risk is rising because source-system dependencies are still unresolved. Staffing is manageable, but sequencing is not yet stable.',
    },
    {
      id: 'project-aurelia-archive',
      clientId: 'client-aurelia-foundation',
      projectName: 'Aurelia Foundation Archive Refresh',
      description:
        'Completed archival refresh and delivery handoff for the foundation site.',
      status: 'Complete',
      phase: 'Closed',
      health: 'Complete',
      startDate: '2026-02-01',
      targetCompletionDate: '2026-04-18',
      internalLead: 'Dana Mercer',
      primaryClientContact: 'Clara Jensen',
      progressPercent: 100,
      nextMilestoneId: 'milestone-aurelia-handoff',
      lastUpdated: '2026-04-18T16:45:00.000Z',
      internalNotes:
        'Closed cleanly. Archive this project once final analytics export is stored internally.',
    },
  ];

  const milestones: MilestoneRecord[] = [
    {
      id: 'milestone-horizon-executive',
      projectId: 'project-horizon-refinement',
      title: 'Meeting with Executive Stakeholders',
      stageLabel: 'Stakeholder Review',
      status: 'Complete',
      date: '2026-04-22',
      summary:
        'Executive stakeholders reviewed the proposed design directions and selected Direction 3 for further refinement.',
      details:
        'Stakeholders aligned on Direction 3 as the preferred direction for the next design phase. The client team indicated they would provide additional content and internal feedback by April 29, 2026.',
      decisions: ['Direction 3 selected for continuation'],
      clientActionItems: [
        'Deliver additional brand references by April 29, 2026',
        'Confirm final stakeholder list for next review',
      ],
      internalActionItems: [
        'Refine design direction 3 into homepage concept',
        'Prepare next-stage review deck',
      ],
      dueDate: '2026-04-29',
      owner: 'Jordan Lee',
      updatedAt: '2026-04-22T15:30:00.000Z',
      internalNotes:
        'Stakeholder sentiment was stronger than expected. Keep internal exploration notes separate from client materials.',
      clientVisible: true,
      attachmentIds: ['resource-horizon-review-deck'],
    },
    {
      id: 'milestone-horizon-homepage-review',
      projectId: 'project-horizon-refinement',
      title: 'Homepage Concept Review',
      stageLabel: 'Concept Review',
      status: 'In Progress',
      date: '2026-05-01',
      summary:
        'Mirror Progress is refining the selected direction into a homepage concept deck for the next client review.',
      details:
        'The current work is focused on translating the approved direction into a homepage concept with updated structure, content framing, and pacing for the next stakeholder session.',
      decisions: [
        'Next review will center on a single refined direction rather than multiple parallel explorations.',
      ],
      clientActionItems: [
        'Provide stakeholder availability for the May 1 review',
        'Share any new content constraints before deck lock',
      ],
      internalActionItems: [
        'Finalize concept deck',
        'Align prototype pacing with the selected narrative structure',
      ],
      dueDate: '2026-05-01',
      owner: 'Jordan Lee',
      updatedAt: '2026-04-22T15:05:00.000Z',
      internalNotes:
        'Pricing conversation should not enter the client deck. Keep staffing notes internal.',
      clientVisible: true,
      attachmentIds: ['resource-horizon-prototype'],
    },
    {
      id: 'milestone-northline-materials',
      projectId: 'project-northline-launch',
      title: 'Launch Materials Delivery',
      stageLabel: 'Materials Checkpoint',
      status: 'Awaiting Client',
      date: '2026-04-30',
      summary:
        'Launch planning is waiting on source content and legal approvals from the client team.',
      details:
        'Pending client delivery of approved launch copy, legal review notes, and final asset packaging for the next release stage.',
      decisions: ['Launch sequence will stay unchanged until legal review is complete.'],
      clientActionItems: [
        'Provide approved launch copy',
        'Share final legal review notes',
      ],
      internalActionItems: [
        'Hold QA scheduling until materials arrive',
        'Prepare revised release checklist',
      ],
      dueDate: '2026-04-30',
      owner: 'Dana Mercer',
      updatedAt: '2026-04-21T18:00:00.000Z',
      internalNotes:
        'Escalation may be needed if legal review slips again, but keep external tone factual.',
      clientVisible: true,
      attachmentIds: ['resource-northline-content-brief'],
    },
    {
      id: 'milestone-atlas-dependency-review',
      projectId: 'project-atlas-ops',
      title: 'Dependency Review',
      stageLabel: 'Implementation Checkpoint',
      status: 'In Progress',
      date: '2026-04-26',
      summary:
        'The implementation plan is being reworked around unresolved data-source dependencies.',
      details:
        'The current review is focused on reconciling infrastructure dependencies before the next planning decision is finalized.',
      decisions: ['The next sprint cannot begin until the dependency map is confirmed.'],
      clientActionItems: [
        'Confirm vendor API constraints',
        'Provide final owner for access approvals',
      ],
      internalActionItems: [
        'Re-sequence implementation plan',
        'Document dependency risks',
      ],
      dueDate: '2026-04-26',
      owner: 'Jordan Lee',
      updatedAt: '2026-04-20T11:15:00.000Z',
      internalNotes:
        'There is delivery concern here. Keep staffing and negotiation context in internal notes only.',
      clientVisible: true,
      attachmentIds: ['resource-atlas-risk-notes'],
    },
    {
      id: 'milestone-aurelia-handoff',
      projectId: 'project-aurelia-archive',
      title: 'Archive Handoff',
      stageLabel: 'Delivery',
      status: 'Complete',
      date: '2026-04-18',
      summary:
        'The refreshed archive was delivered and the client confirmed closeout.',
      details:
        'Mirror Progress completed delivery, walkthrough, and final handoff materials for the archive refresh effort.',
      decisions: ['Project closed after walkthrough completion.'],
      clientActionItems: [],
      internalActionItems: ['Archive internal notes and analytics export'],
      dueDate: '2026-04-18',
      owner: 'Dana Mercer',
      updatedAt: '2026-04-18T16:45:00.000Z',
      internalNotes:
        'Final analytics cleanup remains internal and should not appear in the client-facing record.',
      clientVisible: true,
      attachmentIds: ['resource-aurelia-deliverable'],
    },
  ];

  const decisions: DecisionRecord[] = [
    {
      id: 'decision-horizon-direction-3',
      projectId: 'project-horizon-refinement',
      milestoneId: 'milestone-horizon-executive',
      decision: 'Direction 3 was selected as the basis for the next design phase.',
      madeBy: 'Executive stakeholder group',
      date: '2026-04-22',
      notes:
        'The team aligned on a single direction to tighten review cycles and reduce ambiguity in the next concept pass.',
      clientVisible: true,
    },
    {
      id: 'decision-northline-hold-sequence',
      projectId: 'project-northline-launch',
      milestoneId: 'milestone-northline-materials',
      decision: 'Launch sequence will remain unchanged until legal review is complete.',
      madeBy: 'Northline launch working group',
      date: '2026-04-21',
      notes:
        'This keeps the release plan stable and avoids duplicate review loops.',
      clientVisible: true,
    },
    {
      id: 'decision-atlas-dependency-gate',
      projectId: 'project-atlas-ops',
      milestoneId: 'milestone-atlas-dependency-review',
      decision: 'Implementation kickoff is gated on dependency confirmation.',
      madeBy: 'Mirror Progress delivery team',
      date: '2026-04-20',
      notes:
        'Internal risk notes remain separate from the client-facing summary.',
      clientVisible: true,
    },
  ];

  const actionItems: ActionItemRecord[] = [
    {
      id: 'action-horizon-brand-references',
      projectId: 'project-horizon-refinement',
      relatedMilestoneId: 'milestone-horizon-executive',
      description: 'Deliver additional brand references for concept refinement.',
      assignedTo: 'Sarah Bennett',
      ownerType: 'Client',
      dueDate: '2026-04-29',
      status: 'Awaiting Client',
      clientVisible: true,
    },
    {
      id: 'action-horizon-refine-direction',
      projectId: 'project-horizon-refinement',
      relatedMilestoneId: 'milestone-horizon-homepage-review',
      description: 'Refine Direction 3 into the homepage concept review deck.',
      assignedTo: 'Jordan Lee',
      ownerType: 'Mirror Progress',
      dueDate: '2026-04-30',
      status: 'In Progress',
      clientVisible: true,
    },
    {
      id: 'action-northline-legal-notes',
      projectId: 'project-northline-launch',
      relatedMilestoneId: 'milestone-northline-materials',
      description: 'Share final legal review notes for launch signoff.',
      assignedTo: 'Maya Chen',
      ownerType: 'Client',
      dueDate: '2026-04-30',
      status: 'Awaiting Client',
      clientVisible: true,
    },
    {
      id: 'action-atlas-owner-confirmation',
      projectId: 'project-atlas-ops',
      relatedMilestoneId: 'milestone-atlas-dependency-review',
      description: 'Confirm final owner for dependency access approvals.',
      assignedTo: 'Elias Porter',
      ownerType: 'Client',
      dueDate: '2026-04-19',
      status: 'Blocked',
      clientVisible: true,
    },
    {
      id: 'action-atlas-risk-brief',
      projectId: 'project-atlas-ops',
      relatedMilestoneId: 'milestone-atlas-dependency-review',
      description: 'Document delivery risk summary for internal planning.',
      assignedTo: 'Jordan Lee',
      ownerType: 'Mirror Progress',
      dueDate: '2026-04-21',
      status: 'In Progress',
      clientVisible: false,
    },
  ];

  const resources: ResourceRecord[] = [
    {
      id: 'resource-horizon-review-deck',
      projectId: 'project-horizon-refinement',
      title: 'Direction 3 Review Deck',
      url: '/workspace-assets/direction-3-review-deck.txt',
      type: 'Deck',
      addedAt: '2026-04-22T14:15:00.000Z',
      clientVisible: true,
    },
    {
      id: 'resource-horizon-prototype',
      projectId: 'project-horizon-refinement',
      title: 'Homepage Concept Prototype',
      url: '/workspace-assets/homepage-concept-prototype.txt',
      type: 'Prototype',
      addedAt: '2026-04-22T15:10:00.000Z',
      clientVisible: true,
    },
    {
      id: 'resource-northline-content-brief',
      projectId: 'project-northline-launch',
      title: 'Launch Content Brief',
      url: '/workspace-assets/content-request-brief.txt',
      type: 'Doc',
      addedAt: '2026-04-21T18:30:00.000Z',
      clientVisible: true,
    },
    {
      id: 'resource-atlas-risk-notes',
      projectId: 'project-atlas-ops',
      title: 'Dependency Risk Notes',
      url: '/workspace-assets/content-request-brief.txt',
      type: 'Doc',
      addedAt: '2026-04-20T11:10:00.000Z',
      clientVisible: false,
    },
    {
      id: 'resource-aurelia-deliverable',
      projectId: 'project-aurelia-archive',
      title: 'Archive Delivery Package',
      url: '/workspace-assets/direction-3-review-deck.txt',
      type: 'Deliverable',
      addedAt: '2026-04-18T16:00:00.000Z',
      clientVisible: true,
    },
  ];

  const activity: ActivityLogRecord[] = [
    {
      id: 'activity-project-horizon-created',
      actorLabel: 'Mirror Progress',
      projectId: 'project-horizon-refinement',
      type: 'project_created',
      message: 'Project created for Horizon Biolabs.',
      createdAt: '2026-04-08T09:10:00.000Z',
    },
    {
      id: 'activity-horizon-milestone-added',
      actorLabel: 'Jordan Lee',
      projectId: 'project-horizon-refinement',
      type: 'milestone_added',
      message: 'Added the executive stakeholder review milestone.',
      createdAt: '2026-04-20T12:10:00.000Z',
    },
    {
      id: 'activity-horizon-status-updated',
      actorLabel: 'Jordan Lee',
      projectId: 'project-horizon-refinement',
      type: 'status_changed',
      message: 'Project status updated to In Progress.',
      createdAt: '2026-04-22T15:30:00.000Z',
    },
    {
      id: 'activity-northline-awaiting-client',
      actorLabel: 'Dana Mercer',
      projectId: 'project-northline-launch',
      type: 'status_changed',
      message: 'Project status updated to Awaiting Client Response.',
      createdAt: '2026-04-21T18:00:00.000Z',
    },
    {
      id: 'activity-atlas-risk-note',
      actorLabel: 'Jordan Lee',
      projectId: 'project-atlas-ops',
      type: 'project_updated',
      message: 'Updated internal notes and revised implementation timing.',
      createdAt: '2026-04-20T11:15:00.000Z',
    },
    {
      id: 'activity-client-northline-created',
      actorLabel: 'Avery Cole',
      type: 'client_created',
      message: 'Created client access for Northline Energy.',
      createdAt: '2026-04-01T08:15:00.000Z',
    },
  ];

  return {
    clients,
    projects,
    milestones,
    decisions,
    actionItems,
    resources,
    activity,
  };
}
