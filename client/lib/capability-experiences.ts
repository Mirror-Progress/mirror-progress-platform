export type CapabilityMode = 'proposal' | 'operations' | 'infrastructure' | 'audit';

export type CapabilityTone = 'neutral' | 'accent' | 'success' | 'warning';

export type CapabilityArtifact = {
  label: string;
  value: string;
  tone?: CapabilityTone;
};

export type CapabilityStep = {
  id: string;
  label: string;
  headline: string;
  description: string;
  metric: string;
  metricLabel: string;
  statusLabel: string;
  artifacts: CapabilityArtifact[];
  activity: string[];
  checklist: string[];
};

export type CapabilityOutcome = {
  title: string;
  description: string;
  metric?: string;
};

export type CapabilityExperience = {
  mode: CapabilityMode;
  title: string;
  eyebrow: string;
  purpose: string;
  audience: string;
  ctaLabel: string;
  sampleContextTitle: string;
  sampleContextBody: string;
  heroStats: CapabilityArtifact[];
  systemLayers: string[];
  steps: CapabilityStep[];
  outcomes: CapabilityOutcome[];
  implementationSteps?: Array<[string, string, string]>;
  notes: string[];
};

export const proposalIntelligenceExperience: CapabilityExperience = {
  mode: 'proposal',
  title: 'Proposal Intelligence Systems',
  eyebrow: 'Private Mirror Progress capability brief',
  purpose:
    'AI-assisted pursuit systems for architecture and design teams that need to find stronger opportunities, qualify them faster, retrieve the right precedents, and shape sharper proposal narratives.',
  audience: 'Architecture and design practices with complex portfolios, recurring RFPs, and high-value pursuit decisions.',
  ctaLabel: 'Discuss a System Like This',
  sampleContextTitle: 'Sample opportunity',
  sampleContextBody:
    'A civic client has released a competition for a waterfront arts and learning center with public realm, adaptive reuse, and community engagement requirements.',
  heroStats: [
    { label: 'Pursuit type', value: 'Civic / Cultural', tone: 'accent' },
    { label: 'Fit signal', value: '86%', tone: 'success' },
    { label: 'Cycle saved', value: '2-3 days', tone: 'neutral' },
  ],
  systemLayers: [
    'RFP and opportunity feeds',
    'Portfolio and precedent memory',
    'Fit scoring logic',
    'Proposal narrative workspace',
    'Human go / no-go review',
  ],
  steps: [
    {
      id: 'discover',
      label: 'Opportunity discovery',
      headline: 'Monitor opportunity sources without turning the studio into a search desk.',
      description:
        'The system collects public RFPs, invited opportunities, and partner notes into a structured pursuit queue with deadlines, sector tags, and qualification signals.',
      metric: '14',
      metricLabel: 'new signals grouped',
      statusLabel: 'Source scan complete',
      artifacts: [
        { label: 'Client', value: 'Waterfront Arts Authority' },
        { label: 'Deadline', value: '21 days' },
        { label: 'Delivery', value: 'Competition + concept package' },
      ],
      activity: [
        'Grouped duplicate listings across procurement portals.',
        'Extracted sector, location, due date, and eligibility constraints.',
        'Flagged cultural, civic, and adaptive-reuse language.',
      ],
      checklist: ['Source verified', 'Deadline extracted', 'Sector tagged'],
    },
    {
      id: 'summarize',
      label: 'AI opportunity summary',
      headline: 'Turn dense RFP language into an executive pursuit brief.',
      description:
        'The system produces a concise brief covering scope, stakeholders, constraints, risks, and the first questions a principal should ask before committing studio time.',
      metric: '7',
      metricLabel: 'decision factors',
      statusLabel: 'Brief ready',
      artifacts: [
        { label: 'Primary need', value: 'Public-facing cultural destination' },
        { label: 'Risk', value: 'Compressed Q+A window', tone: 'warning' },
        { label: 'Decision lens', value: 'Portfolio alignment' },
      ],
      activity: [
        'Compressed 43 pages into a structured pursuit memo.',
        'Separated confirmed requirements from interpretation.',
        'Identified budget, team, and submission unknowns.',
      ],
      checklist: ['Scope summarized', 'Risks separated', 'Unknowns listed'],
    },
    {
      id: 'score',
      label: 'Portfolio fit scoring',
      headline: 'Score the pursuit against actual studio strengths.',
      description:
        'Portfolio, sector, geography, team capacity, and design themes are scored so the team can compare opportunities with consistent reasoning instead of vibes alone.',
      metric: '86',
      metricLabel: 'fit score',
      statusLabel: 'Strong fit',
      artifacts: [
        { label: 'Sector fit', value: 'Cultural / civic', tone: 'success' },
        { label: 'Design themes', value: 'Waterfront, reuse, public realm' },
        { label: 'Capacity note', value: 'Needs partner review', tone: 'warning' },
      ],
      activity: [
        'Matched project language against public portfolio themes.',
        'Weighted cultural work and public-realm experience higher.',
        'Flagged delivery complexity for leadership review.',
      ],
      checklist: ['Portfolio mapped', 'Risk weighted', 'Score explained'],
    },
    {
      id: 'retrieve',
      label: 'Relevant precedent retrieval',
      headline: 'Retrieve the right proof without manually digging through archives.',
      description:
        'The system surfaces past projects, narratives, images, awards, and team experience that are relevant to the opportunity and ready for human curation.',
      metric: '5',
      metricLabel: 'precedents surfaced',
      statusLabel: 'Precedents ranked',
      artifacts: [
        { label: 'Closest precedent', value: 'Harbor Arts Pavilion' },
        { label: 'Secondary proof', value: 'Riverfront Commons Library' },
        { label: 'Narrative theme', value: 'Civic memory + public access' },
      ],
      activity: [
        'Retrieved portfolio entries by typology and design theme.',
        'Linked supporting awards, press, and project facts.',
        'Marked items requiring human visual curation.',
      ],
      checklist: ['Precedents ranked', 'Sources linked', 'Claims checked'],
    },
    {
      id: 'draft',
      label: 'Proposal draft generation',
      headline: 'Generate a controlled first draft that starts from verified material.',
      description:
        'Draft sections are assembled from approved facts, precedent notes, and pursuit strategy so the proposal team starts with a usable skeleton rather than a blank page.',
      metric: '3',
      metricLabel: 'draft sections',
      statusLabel: 'Draft gated for review',
      artifacts: [
        { label: 'Section', value: 'Design approach' },
        { label: 'Section', value: 'Relevant experience' },
        { label: 'Section', value: 'Team narrative' },
      ],
      activity: [
        'Generated a principal-facing response outline.',
        'Inserted only source-backed project claims.',
        'Held final language for human review before use.',
      ],
      checklist: ['Draft sections built', 'Unsupported claims blocked', 'Review required'],
    },
    {
      id: 'recommend',
      label: 'Pursuit recommendation',
      headline: 'End with a clear recommendation and the next best action.',
      description:
        'The system recommends pursue, nurture, decline, or needs-review, with a concise rationale and a suggested first internal decision meeting agenda.',
      metric: 'Pursue',
      metricLabel: 'recommended action',
      statusLabel: 'Leadership review ready',
      artifacts: [
        { label: 'Recommendation', value: 'Pursue with focused concept note', tone: 'success' },
        { label: 'First action', value: 'Principal review + partner screen' },
        { label: 'Do not claim', value: 'No prior relationship implied', tone: 'warning' },
      ],
      activity: [
        'Prepared go / no-go rationale for leadership.',
        'Listed open questions for the client or procurement contact.',
        'Preserved do-not-claim notes for proposal safety.',
      ],
      checklist: ['Recommendation set', 'Next action assigned', 'Safety notes preserved'],
    },
  ],
  outcomes: [
    {
      title: 'Faster go / no-go decisions',
      description:
        'Leadership can compare pursuits against a consistent fit model before committing proposal hours.',
      metric: 'Less manual triage',
    },
    {
      title: 'Stronger proposal memory',
      description:
        "The studio's portfolio, awards, narratives, and proof points become searchable pursuit infrastructure.",
      metric: 'Reusable precedent layer',
    },
    {
      title: 'Safer AI drafting',
      description:
        'Generated copy is constrained by verified claims and routed through human review before use.',
      metric: 'Approval-first workflow',
    },
  ],
  notes: [
    'Adapted a dark opportunity-review language: compact source badges, dense metadata cards, and an active pursuit brief.',
    'Reframed the experience as a Mirror Progress capability rather than a named product or standalone platform.',
  ],
};

export const operationalIntelligenceExperience: CapabilityExperience = {
  mode: 'operations',
  title: 'Operational Intelligence Systems',
  eyebrow: 'Private Mirror Progress capability brief',
  purpose:
    'AI-native internal systems that combine chat, agents, database syncing, research, scheduling, and dashboards so teams can turn operational requests into tracked action.',
  audience: 'Growing organizations with fragmented tools, recurring follow-ups, internal knowledge sprawl, and workflow decisions that need better memory.',
  ctaLabel: 'Explore a Custom Build',
  sampleContextTitle: 'Sample command',
  sampleContextBody:
    "Find stalled client decisions, summarize risk, draft follow-up tasks, check schedule conflicts, and prepare tomorrow morning's leadership brief.",
  heroStats: [
    { label: 'Systems touched', value: '6', tone: 'accent' },
    { label: 'Actions prepared', value: '11', tone: 'success' },
    { label: 'Human gates', value: '3', tone: 'neutral' },
  ],
  systemLayers: [
    'Command and chat interface',
    'Agent interpretation layer',
    'Internal database sync',
    'Task and schedule automation',
    'Dashboard intelligence',
    'Human approval gates',
  ],
  steps: [
    {
      id: 'request',
      label: 'Operational request',
      headline: 'A team member makes a plain-language request.',
      description:
        'The system accepts a natural operational command, identifies the intended workflow, and keeps the user oriented with clear state transitions.',
      metric: '1',
      metricLabel: 'command received',
      statusLabel: 'Request captured',
      artifacts: [
        { label: 'Requester', value: 'Operations lead' },
        { label: 'Intent', value: 'Client decision review' },
        { label: 'Boundary', value: 'Prepare only; no auto-send', tone: 'warning' },
      ],
      activity: [
        'Parsed a multi-step operations request.',
        'Detected follow-up, research, schedule, and dashboard intents.',
        'Applied safety rules before action planning.',
      ],
      checklist: ['Intent captured', 'Safety boundary set', 'Workflow started'],
    },
    {
      id: 'interpret',
      label: 'Agent interpretation',
      headline: 'The agent converts the request into a structured workflow plan.',
      description:
        'Ambiguous language is translated into tasks, required data sources, missing inputs, and approval gates before any meaningful action is prepared.',
      metric: '4',
      metricLabel: 'workstreams planned',
      statusLabel: 'Plan assembled',
      artifacts: [
        { label: 'Workstream', value: 'Client status review' },
        { label: 'Workstream', value: 'Research summary' },
        { label: 'Workstream', value: 'Calendar scan' },
      ],
      activity: [
        'Split the request into executable sub-tasks.',
        'Ranked data sources by reliability and recency.',
        'Identified approvals needed before external updates.',
      ],
      checklist: ['Tasks decomposed', 'Sources ranked', 'Approvals mapped'],
    },
    {
      id: 'sync',
      label: 'Data search and sync',
      headline: 'The system searches internal data without losing source context.',
      description:
        'Projects, notes, tasks, messages, calendars, and CRM records can be normalized into a temporary intelligence view that preserves where each claim came from.',
      metric: '28',
      metricLabel: 'records reviewed',
      statusLabel: 'Internal scan complete',
      artifacts: [
        { label: 'Project records', value: '9 matched' },
        { label: 'Client notes', value: '13 matched' },
        { label: 'Calendar items', value: '6 matched' },
      ],
      activity: [
        'Joined project, client, and calendar records.',
        'Flagged stale or conflicting information.',
        'Kept source references attached to each summary.',
      ],
      checklist: ['Records joined', 'Conflicts flagged', 'Sources preserved'],
    },
    {
      id: 'execute',
      label: 'Task, research, schedule action',
      headline: 'Actions are prepared with human control intact.',
      description:
        'The system can draft tasks, assemble research, suggest schedule moves, and prepare next actions while keeping execution gated where risk is higher.',
      metric: '11',
      metricLabel: 'actions prepared',
      statusLabel: 'Actions staged',
      artifacts: [
        { label: 'Tasks', value: '6 drafted' },
        { label: 'Research briefs', value: '2 assembled' },
        { label: 'Schedule notes', value: '3 proposed' },
      ],
      activity: [
        'Generated follow-up tasks for delayed decisions.',
        'Prepared research notes for leadership review.',
        'Suggested schedule blocks without mutating calendars.',
      ],
      checklist: ['Tasks staged', 'Research drafted', 'No external sends'],
    },
    {
      id: 'dashboard',
      label: 'Dashboard update',
      headline: 'Leadership sees the operational picture update in one place.',
      description:
        'A dashboard view translates behind-the-scenes work into decision-ready intelligence: risk, owner, next action, dependency, and freshness.',
      metric: '4',
      metricLabel: 'risk items surfaced',
      statusLabel: 'Dashboard refreshed',
      artifacts: [
        { label: 'Stalled decisions', value: '4', tone: 'warning' },
        { label: 'Follow-ups due', value: '6' },
        { label: 'Brief status', value: 'Ready for review', tone: 'success' },
      ],
      activity: [
        'Updated the leadership brief preview.',
        'Grouped risks by owner and urgency.',
        'Separated confirmed facts from agent interpretation.',
      ],
      checklist: ['Metrics refreshed', 'Risks grouped', 'Interpretation labeled'],
    },
    {
      id: 'intelligence',
      label: 'Actionable intelligence',
      headline: 'The team receives a concise, usable operating brief.',
      description:
        'The final output is not just a chatbot response. It is a source-aware brief with prepared actions, owner suggestions, and approval checkpoints.',
      metric: 'Ready',
      metricLabel: 'team brief status',
      statusLabel: 'Review package complete',
      artifacts: [
        { label: 'Brief', value: 'Morning operations digest' },
        { label: 'Approvals', value: '3 pending gates' },
        { label: 'Outcome', value: 'Team-ready actions', tone: 'success' },
      ],
      activity: [
        'Prepared a concise operational digest.',
        'Attached source notes to sensitive claims.',
        'Kept human review before any external system write.',
      ],
      checklist: ['Brief assembled', 'Owners suggested', 'Approvals retained'],
    },
  ],
  outcomes: [
    {
      title: 'Shared operating memory',
      description:
        'Work scattered across tools becomes easier to search, summarize, and turn into accountable action.',
      metric: 'Less context loss',
    },
    {
      title: 'Agent-assisted workflows',
      description:
        'Agents help plan, retrieve, draft, and prepare work while humans approve sensitive execution.',
      metric: 'Controlled automation',
    },
    {
      title: 'Cleaner leadership visibility',
      description:
        'Dashboards move from passive reporting to active operational intelligence with source-aware updates.',
      metric: 'Decision-ready view',
    },
  ],
  notes: [
    'Adapted an operational workspace language: command panels, progressive agent states, connection-like status chips, and compact intelligence cards.',
    'Rebranded the flow as a Mirror Progress custom system capability rather than a named internal application.',
  ],
};

export const futureReadyInfrastructureExperience: CapabilityExperience = {
  mode: 'infrastructure',
  title: 'Future-Ready Infrastructure Systems',
  eyebrow: 'Private Mirror Progress capability brief',
  purpose:
    'AI fails when the underlying systems are fragmented. Mirror Progress modernizes the data, workflows, and digital infrastructure that AI agents, dashboards, and automation depend on.',
  audience:
    'Mid-market organizations with legacy systems, manual reporting, document-heavy operations, and leadership pressure to become AI-ready without replacing everything at once.',
  ctaLabel: 'Start an AI Readiness Audit',
  sampleContextTitle: 'Sample modernization signal',
  sampleContextBody:
    'A growing infrastructure services firm wants AI-assisted reporting, but critical project data lives across spreadsheets, PDFs, email, finance exports, and disconnected operational tools.',
  heroStats: [
    { label: 'Systems assessed', value: '8', tone: 'accent' },
    { label: 'Readiness blockers', value: '14', tone: 'warning' },
    { label: 'Audit path', value: '2 weeks', tone: 'success' },
  ],
  systemLayers: [
    'Legacy system and file inventory',
    'Workflow and reporting map',
    'Data normalization layer',
    'Access and governance model',
    'AI-ready operating layer',
    'Readiness audit pathway',
  ],
  steps: [
    {
      id: 'fragmented-systems',
      label: 'Identify fragmented systems',
      headline: 'See where operational reality is scattered before adding AI.',
      description:
        'The system maps the tools, files, exports, and manual handoffs that hold the business together so modernization starts from the actual operating environment.',
      metric: '8',
      metricLabel: 'systems assessed',
      statusLabel: 'System inventory mapped',
      artifacts: [
        { label: 'Source', value: 'Spreadsheets' },
        { label: 'Source', value: 'PDF reports' },
        { label: 'Source', value: 'CRM + finance exports' },
      ],
      activity: [
        'Grouped scattered systems by workflow dependency.',
        'Flagged data sources that require human interpretation.',
        'Separated core systems from shadow processes.',
      ],
      checklist: ['Sources inventoried', 'Manual handoffs found', 'Critical records tagged'],
    },
    {
      id: 'workflow-map',
      label: 'Map critical workflows',
      headline: 'Connect modernization to the workflows that create business value.',
      description:
        'Instead of modernizing infrastructure abstractly, Mirror Progress maps reporting, approvals, client updates, and operational decisions into a workflow-first view.',
      metric: '6',
      metricLabel: 'workflows mapped',
      statusLabel: 'Workflow map assembled',
      artifacts: [
        { label: 'Workflow', value: 'Monthly reporting' },
        { label: 'Workflow', value: 'Project status review' },
        { label: 'Workflow', value: 'Client-ready update' },
      ],
      activity: [
        'Identified which workflows depend on stale or duplicated data.',
        'Mapped handoffs between teams, systems, and approvals.',
        'Ranked modernization value by operating friction.',
      ],
      checklist: ['Workflow owners identified', 'Decision points mapped', 'Friction ranked'],
    },
    {
      id: 'normalize',
      label: 'Normalize data and documents',
      headline: 'Turn messy records into structured inputs AI can safely use.',
      description:
        'Documents, spreadsheets, exports, and internal records are converted into consistent entities, metadata, and source-aware summaries.',
      metric: '31',
      metricLabel: 'records normalized',
      statusLabel: 'Data layer structured',
      artifacts: [
        { label: 'Entity', value: 'Project' },
        { label: 'Entity', value: 'Client' },
        { label: 'Entity', value: 'Report requirement' },
      ],
      activity: [
        'Extracted fields from documents and recurring reports.',
        'Attached source references to normalized records.',
        'Flagged missing fields that reduce AI reliability.',
      ],
      checklist: ['Entities defined', 'Sources preserved', 'Missing fields surfaced'],
    },
    {
      id: 'governance',
      label: 'Add governance and access rules',
      headline: 'Make the future operating layer trustworthy before it becomes automated.',
      description:
        'The system defines who can see, review, approve, and act on sensitive information so AI readiness includes security and governance from the beginning.',
      metric: '5',
      metricLabel: 'control points',
      statusLabel: 'Governance layer drafted',
      artifacts: [
        { label: 'Gate', value: 'Human review' },
        { label: 'Gate', value: 'Client-visible boundary' },
        { label: 'Gate', value: 'External write approval' },
      ],
      activity: [
        'Mapped sensitive fields and role-based visibility needs.',
        'Separated read-only intelligence from future write actions.',
        'Defined approval gates for external effects.',
      ],
      checklist: ['Access rules drafted', 'Risk boundaries set', 'Approval gates marked'],
    },
    {
      id: 'ai-ready-layer',
      label: 'Create AI-ready operating layer',
      headline: 'Move from disconnected tools to an intelligent operational layer.',
      description:
        'The normalized data, workflow map, and governance model become the base for dashboards, retrieval, agent assistance, and future automation.',
      metric: '4',
      metricLabel: 'AI use cases staged',
      statusLabel: 'Operating layer preview ready',
      artifacts: [
        { label: 'Use case', value: 'Leadership brief' },
        { label: 'Use case', value: 'Document intelligence' },
        { label: 'Use case', value: 'Workflow assistant' },
      ],
      activity: [
        'Grouped AI use cases by readiness and risk.',
        'Prepared a source-aware dashboard concept.',
        'Identified the first workflow that can produce measurable value.',
      ],
      checklist: ['Use cases staged', 'Readiness scored', 'First build path selected'],
    },
    {
      id: 'audit-path',
      label: 'Recommend audit path',
      headline: 'End with a practical path from modernization pressure to next action.',
      description:
        'The system produces a concise audit path showing what to inspect first, what is blocked, and which sprint should follow the readiness review.',
      metric: 'Audit',
      metricLabel: 'recommended next step',
      statusLabel: 'Audit path ready',
      artifacts: [
        { label: 'Recommendation', value: 'Start readiness audit', tone: 'success' },
        { label: 'First focus', value: 'Reporting + document layer' },
        { label: 'Do not skip', value: 'Governance review', tone: 'warning' },
      ],
      activity: [
        'Prepared an executive modernization summary.',
        'Translated infrastructure gaps into audit questions.',
        'Connected the audit to a first AI-ready workflow sprint.',
      ],
      checklist: ['Audit scope drafted', 'Blockers listed', 'Sprint path outlined'],
    },
  ],
  outcomes: [
    {
      title: 'AI-ready data foundation',
      description:
        'Scattered documents, exports, and systems become structured enough for retrieval, reporting, and workflow intelligence.',
      metric: 'Modernization wedge',
    },
    {
      title: 'Less manual reporting',
      description:
        'Recurring reporting and leadership updates can move from manual stitching to source-aware operating views.',
      metric: 'Operational leverage',
    },
    {
      title: 'Safer automation path',
      description:
        'Governance, access, and approval boundaries are defined before AI workflows touch sensitive decisions.',
      metric: 'Trust before scale',
    },
  ],
  implementationSteps: [
    ['01', 'Map systems and workflows', 'Inventory the systems, files, exports, decisions, and manual reporting loops that define the current operating model.'],
    ['02', 'Design the readiness layer', 'Define normalized entities, governance boundaries, source ownership, and access rules before AI workflows are introduced.'],
    ['03', 'Build toward first useful AI workflow', 'Start with one high-value workflow, connect the minimum viable data layer, and expand once the operating model proves value.'],
  ],
  notes: [
    'Built as the strategic BD microsite that explains why infrastructure modernization is the prerequisite to useful AI.',
    'Routes prospects toward the readiness audit rather than a generic transformation conversation.',
  ],
};

export const aiReadinessAuditExperience: CapabilityExperience = {
  mode: 'audit',
  title: 'AI Readiness Audit',
  eyebrow: 'Private Mirror Progress capability brief',
  purpose:
    'A focused diagnostic that shows which workflows are ready for AI, which are blocked by data or governance gaps, and what Mirror Progress should build first.',
  audience:
    'Leadership teams that want practical AI adoption but need a clear first move, a credible roadmap, and a grounded view of infrastructure, data, and workflow readiness.',
  ctaLabel: 'Book a Readiness Review',
  sampleContextTitle: 'Sample audit question',
  sampleContextBody:
    'Which business workflow should we modernize first, what data does it require, what risks need approval, and what can we build in the first sprint?',
  heroStats: [
    { label: 'Workflows reviewed', value: '6', tone: 'accent' },
    { label: 'Data gaps surfaced', value: '12', tone: 'warning' },
    { label: 'Roadmap options', value: '3', tone: 'success' },
  ],
  systemLayers: [
    'Business goal intake',
    'Workflow and source inventory',
    'Data readiness scoring',
    'Governance and risk review',
    'Opportunity prioritization',
    'Sprint roadmap recommendation',
  ],
  steps: [
    {
      id: 'intake',
      label: 'Intake business goals',
      headline: 'Start with business pressure, not AI novelty.',
      description:
        'The audit captures growth goals, operational bottlenecks, leadership questions, and current AI pressure so the work is anchored to actual business outcomes.',
      metric: '5',
      metricLabel: 'goals captured',
      statusLabel: 'Intake complete',
      artifacts: [
        { label: 'Goal', value: 'Reduce manual reporting' },
        { label: 'Goal', value: 'Improve BD follow-up' },
        { label: 'Goal', value: 'Use documents better' },
      ],
      activity: [
        'Captured current leadership priorities.',
        'Separated AI interest from operational need.',
        'Flagged where urgency is driven by competitors or clients.',
      ],
      checklist: ['Goals captured', 'Business pressure labeled', 'Success measures drafted'],
    },
    {
      id: 'inventory',
      label: 'Inventory workflows and systems',
      headline: 'Reveal what the first AI workflow would actually need.',
      description:
        'The audit maps workflows to systems, files, databases, people, and approvals so the team can see which AI ideas are feasible.',
      metric: '18',
      metricLabel: 'dependencies found',
      statusLabel: 'Inventory assembled',
      artifacts: [
        { label: 'System', value: 'CRM' },
        { label: 'System', value: 'Shared drive' },
        { label: 'System', value: 'Finance export' },
      ],
      activity: [
        'Mapped source dependencies for each candidate workflow.',
        'Identified duplicate and manual records.',
        'Flagged missing owners and access constraints.',
      ],
      checklist: ['Systems listed', 'Dependencies mapped', 'Ownership gaps surfaced'],
    },
    {
      id: 'score-data',
      label: 'Score data readiness',
      headline: 'Quantify what is usable, messy, missing, or risky.',
      description:
        'Sources are scored by freshness, completeness, structure, accessibility, and confidence so readiness becomes visible and comparable.',
      metric: '68',
      metricLabel: 'readiness score',
      statusLabel: 'Data score generated',
      artifacts: [
        { label: 'Strong', value: 'Project records', tone: 'success' },
        { label: 'Weak', value: 'Unstructured PDFs', tone: 'warning' },
        { label: 'Missing', value: 'Owner metadata', tone: 'warning' },
      ],
      activity: [
        'Scored sources against AI-readiness criteria.',
        'Separated usable records from high-risk assumptions.',
        'Listed data cleanup required before automation.',
      ],
      checklist: ['Freshness checked', 'Completeness scored', 'Confidence labeled'],
    },
    {
      id: 'governance-risk',
      label: 'Review governance and risk',
      headline: 'Define where AI can assist and where humans must remain in control.',
      description:
        'The audit identifies sensitive decisions, external effects, client-visible outputs, and approval gates that should shape the first build.',
      metric: '7',
      metricLabel: 'risk gates',
      statusLabel: 'Governance review complete',
      artifacts: [
        { label: 'Risk', value: 'External communication', tone: 'warning' },
        { label: 'Risk', value: 'Client-visible reports', tone: 'warning' },
        { label: 'Gate', value: 'Founder approval' },
      ],
      activity: [
        'Mapped which actions should remain read-only at first.',
        'Marked human approval gates for sensitive outputs.',
        'Identified evaluation needs for future agent workflows.',
      ],
      checklist: ['Sensitive paths tagged', 'Human gates set', 'Evaluation needs listed'],
    },
    {
      id: 'prioritize',
      label: 'Prioritize quick wins',
      headline: 'Choose the first workflow by readiness, value, and risk.',
      description:
        'Candidate workflows are compared so the first sprint is not just exciting, but buildable, safe, and connected to a measurable outcome.',
      metric: '3',
      metricLabel: 'roadmap options',
      statusLabel: 'Priorities ranked',
      artifacts: [
        { label: 'Option 1', value: 'Leadership reporting' },
        { label: 'Option 2', value: 'Document intelligence' },
        { label: 'Option 3', value: 'BD follow-up layer' },
      ],
      activity: [
        'Ranked candidate workflows by readiness and payoff.',
        'Capped high-risk automation until governance improves.',
        'Selected a first sprint with clear data dependencies.',
      ],
      checklist: ['Options ranked', 'Risk weighted', 'Quick win selected'],
    },
    {
      id: 'roadmap',
      label: 'Produce audit roadmap',
      headline: 'Leave with a board-ready roadmap and a buildable next sprint.',
      description:
        'The final audit output summarizes readiness, blockers, recommended sequencing, and the first AI-ready data/workflow sprint.',
      metric: 'Ready',
      metricLabel: 'roadmap status',
      statusLabel: 'Roadmap ready',
      artifacts: [
        { label: 'Phase 1', value: 'Readiness cleanup' },
        { label: 'Phase 2', value: 'Workflow sprint' },
        { label: 'Phase 3', value: 'Platform build' },
      ],
      activity: [
        'Generated an executive readiness summary.',
        'Mapped blockers to remediation steps.',
        'Prepared a first sprint recommendation for review.',
      ],
      checklist: ['Roadmap generated', 'Blockers explained', 'Next sprint scoped'],
    },
  ],
  outcomes: [
    {
      title: 'Clear first move',
      description:
        'Leadership sees which workflow to modernize first and why it is the right place to start.',
      metric: 'Decision clarity',
    },
    {
      title: 'Reduced AI implementation risk',
      description:
        'Data gaps, governance needs, access boundaries, and evaluation risks are surfaced before the build begins.',
      metric: 'Risk-first roadmap',
    },
    {
      title: 'Board/client-ready roadmap',
      description:
        'The audit creates a practical modernization narrative that connects AI ambition to systems, workflows, and budget.',
      metric: 'Executive-ready',
    },
  ],
  implementationSteps: [
    ['01', 'Discovery workshop', 'Capture business goals, workflow pain, AI pressure, existing systems, and the decisions leadership needs to make.'],
    ['02', 'Readiness scoring', 'Score workflows, data sources, governance needs, source confidence, and risk so the first build path is grounded.'],
    ['03', 'Roadmap and sprint recommendation', 'Deliver a practical roadmap with blockers, readiness fixes, and the recommended first AI-ready workflow sprint.'],
  ],
  notes: [
    'Built as the conversion microsite for prospects who understand the infrastructure problem and need a concrete first engagement.',
    'Keeps recommendations advisory and read-only while showing how Mirror Progress would scope the first AI-ready sprint.',
  ],
};
