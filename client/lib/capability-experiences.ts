export type CapabilityMode =
  | 'proposal'
  | 'operations'
  | 'infrastructure'
  | 'audit';

export type CapabilitySceneStage = {
  id: string;
  label: string;
  status: string;
};

export type CapabilityExperience = {
  mode: CapabilityMode;
  title: string;
  eyebrow: string;
  problemQuestion: string;
  problemStatement: string;
  businessCost: string;
  painPoints: string[];
  solutionStatement: string;
  deliverables: string[];
  audience: string;
  ctaLabel: string;
  sceneLabel: string;
  sceneStages: CapabilitySceneStage[];
  notes: string[];
};

export const proposalIntelligenceExperience: CapabilityExperience = {
  mode: 'proposal',
  title: 'Proposal Intelligence',
  eyebrow: 'For proposal-intensive organizations',
  problemQuestion: 'Why does every pursuit start from scratch?',
  problemStatement:
    'Opportunity requirements, relevant experience, and approved proof are spread across files and people. Proposal teams lose valuable time rebuilding knowledge the organization already has.',
  businessCost:
    'Leadership commits expensive pursuit time without consistent qualification, while compressed deadlines leave less room for strategy and senior review.',
  painPoints: [
    'Dense RFPs require hours of manual interpretation.',
    'Relevant experience is difficult to retrieve quickly.',
    'Go / no-go decisions depend on inconsistent evidence.',
  ],
  solutionStatement:
    'Mirror Progress creates a controlled pursuit workspace that extracts requirements, finds relevant precedent, and assembles source-backed material for human review.',
  deliverables: [
    'Opportunity qualification workflow',
    'Searchable precedent library',
    'Review-ready pursuit package',
  ],
  audience:
    'Architecture, engineering, and professional-services teams with recurring high-value pursuits.',
  ctaLabel: 'Discuss a Proposal Intelligence System',
  sceneLabel: 'Sample pursuit diagnosis',
  sceneStages: [
    { id: 'brief', label: 'Read brief', status: 'Requirements identified' },
    { id: 'extract', label: 'Extract', status: 'Risks and deadlines surfaced' },
    { id: 'match', label: 'Match proof', status: 'Relevant experience retrieved' },
    { id: 'assemble', label: 'Assemble', status: 'Pursuit package prepared' },
    { id: 'decide', label: 'Review', status: 'Go / no-go decision ready' },
  ],
  notes: ['Mock data only', 'Human-controlled go / no-go review'],
};

export const operationalIntelligenceExperience: CapabilityExperience = {
  mode: 'operations',
  title: 'Operational Intelligence',
  eyebrow: 'For leaders managing work across disconnected tools',
  problemQuestion: 'Why can’t leadership see what is happening now?',
  problemStatement:
    'Projects, tasks, documents, and decisions live in separate systems. By the time teams assemble an update, the operating picture is already stale.',
  businessCost:
    'People spend time finding status instead of resolving problems, while blockers and client dependencies surface too late for leadership to act.',
  painPoints: [
    'Status reporting depends on manual follow-up.',
    'Important blockers have unclear owners or dependencies.',
    'Leadership briefs become outdated before delivery.',
  ],
  solutionStatement:
    'Mirror Progress connects approved operational signals into a current leadership view that surfaces risk, ownership, and the decisions requiring attention.',
  deliverables: [
    'Connected operational dashboard',
    'Blocker and dependency review',
    'Decision-ready leadership brief',
  ],
  audience:
    'Operational leaders coordinating projects, clients, decisions, and reporting across multiple systems.',
  ctaLabel: 'Discuss an Operational Intelligence System',
  sceneLabel: 'Sample operating brief',
  sceneStages: [
    { id: 'signals', label: 'Connect', status: 'Operating signals connected' },
    { id: 'picture', label: 'Assemble', status: 'Current work assembled' },
    { id: 'risks', label: 'Surface', status: 'Blockers and stale work surfaced' },
    { id: 'priorities', label: 'Prioritize', status: 'Leadership priorities ranked' },
    { id: 'actions', label: 'Review', status: 'Next decisions ready for review' },
  ],
  notes: ['Mock data only', 'No external tools are updated'],
};

export const futureReadyInfrastructureExperience: CapabilityExperience = {
  mode: 'infrastructure',
  title: 'Future-Ready Infrastructure',
  eyebrow: 'For organizations preparing systems for practical AI',
  problemQuestion: 'Why can’t AI use our information reliably?',
  problemStatement:
    'Critical information is scattered across spreadsheets, PDFs, email, shared drives, and operational tools. AI cannot work reliably when records are inconsistent, inaccessible, or poorly governed.',
  businessCost:
    'Reporting remains manual, teams reconcile competing versions of the truth, and automation efforts inherit the same fragmentation they were meant to solve.',
  painPoints: [
    'The same business record differs across systems.',
    'Critical workflows rely on manual handoffs.',
    'Ownership, access, and freshness are unclear.',
  ],
  solutionStatement:
    'Mirror Progress maps the critical workflow, organizes the information it depends on, and designs the governed foundation required for useful AI systems.',
  deliverables: [
    'Systems and source inventory',
    'Workflow and information architecture',
    'AI-ready modernization roadmap',
  ],
  audience:
    'Mid-market organizations with fragmented data, document-heavy workflows, and pressure to adopt AI responsibly.',
  ctaLabel: 'Start an AI Readiness Audit',
  sceneLabel: 'Sample infrastructure diagnosis',
  sceneStages: [
    { id: 'systems', label: 'Inventory', status: 'Critical systems identified' },
    { id: 'workflow', label: 'Map', status: 'Business workflow traced' },
    { id: 'records', label: 'Organize', status: 'Records made consistent' },
    { id: 'controls', label: 'Govern', status: 'Ownership and access attached' },
    { id: 'foundation', label: 'Connect', status: 'AI-ready foundation defined' },
  ],
  notes: ['Mock data only', 'No client systems are connected'],
};

export const aiReadinessAuditExperience: CapabilityExperience = {
  mode: 'audit',
  title: 'AI Readiness Audit',
  eyebrow: 'A practical first step for AI adoption',
  problemQuestion: 'Where should we use AI first?',
  problemStatement:
    'Leadership sees the potential of AI but lacks a grounded first use case. Workflow value, information readiness, ownership, integration, and risk constraints are still unclear.',
  businessCost:
    'Teams fund broad pilots before confirming that the underlying workflow and information can support production value.',
  painPoints: [
    'Too many possible use cases compete for attention.',
    'Readiness blockers appear after work has already begun.',
    'Risk and ownership boundaries are not defined early.',
  ],
  solutionStatement:
    'Mirror Progress evaluates the workflows that matter, scores value and readiness, and recommends the first implementation that can produce measurable business value.',
  deliverables: [
    'Workflow opportunity map',
    'Readiness and risk findings',
    'Recommended first-sprint roadmap',
  ],
  audience:
    'Leadership teams that want a practical AI roadmap before committing to a larger build.',
  ctaLabel: 'Book an AI Readiness Review',
  sceneLabel: 'Sample readiness decision',
  sceneStages: [
    { id: 'pressure', label: 'Clarify', status: 'Business pressure clarified' },
    { id: 'workflows', label: 'Inventory', status: 'Candidate workflows mapped' },
    { id: 'score', label: 'Score', status: 'Value, readiness, and risk scored' },
    { id: 'rank', label: 'Rank', status: 'Best opportunities ranked' },
    { id: 'roadmap', label: 'Recommend', status: 'First sprint recommended' },
  ],
  notes: ['Mock data only', 'Recommendations remain human-reviewed'],
};
