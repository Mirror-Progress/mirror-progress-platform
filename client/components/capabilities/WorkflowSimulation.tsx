import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CapabilityMode } from '../../lib/capability-experiences';

type WorkflowSimulationProps = {
  mode: CapabilityMode;
};

type SourceCardProps = {
  title: string;
  detail: string;
  status: string;
  active: boolean;
  complete: boolean;
  index: number;
};

type SyncStatusCardProps = {
  title: string;
  status: string;
  active: boolean;
  complete: boolean;
  index: number;
};

type AnimatedMetricProps = {
  label: string;
  value: string;
  progress: number;
  active: boolean;
};

const phaseLabels = {
  proposal: ['Scan', 'Extract', 'Match', 'Generate', 'Recommend'],
  operations: ['Connect', 'Command', 'Retrieve', 'Act', 'Update'],
  infrastructure: ['Inventory', 'Map', 'Normalize', 'Govern', 'Audit'],
  audit: ['Intake', 'Inventory', 'Score', 'Prioritize', 'Roadmap'],
} as const;

const phaseStatus = {
  proposal: [
    'System standing by',
    'Scanning opportunity sources',
    'Extracting qualified opportunities',
    'Matching against internal precedent memory',
    'Generating proposal support',
    'Recommendation resolved for human review',
  ],
  operations: [
    'System standing by',
    'Connecting operational sources',
    'Interpreting user command',
    'Retrieving relevant internal records',
    'Preparing approved actions',
    'Dashboard and response updated',
  ],
  infrastructure: [
    'System standing by',
    'Inventorying fragmented systems',
    'Mapping critical workflows',
    'Normalizing data and document sources',
    'Applying governance and access rules',
    'AI readiness audit path resolved',
  ],
  audit: [
    'System standing by',
    'Capturing business goals',
    'Inventorying workflows and systems',
    'Scoring readiness and governance risk',
    'Prioritizing buildable AI opportunities',
    'Audit roadmap ready for human review',
  ],
} as const;

const simulationHeaderCopy = {
  proposal: {
    aria: 'Proposal Intelligence Workflow simulation',
    label: 'Proposal Intelligence Workflow',
    title: 'Watch opportunities become proposal-ready intelligence.',
    subtitle:
      'A fast, source-aware mock run showing discovery, extraction, semantic matching, generated proposal material, and a final pursuit recommendation.',
  },
  operations: {
    aria: 'Operational Intelligence Workflow simulation',
    label: 'Operational Intelligence Workflow',
    title: 'Watch fragmented operations become actionable intelligence.',
    subtitle:
      'A fast, source-aware mock run showing connected systems, command interpretation, retrieval, prepared actions, dashboard updates, and the final agent response.',
  },
  infrastructure: {
    aria: 'Future-Ready Infrastructure Workflow simulation',
    label: 'Future-Ready Infrastructure Workflow',
    title: 'Watch fragmented systems become AI-ready infrastructure.',
    subtitle:
      'A fast, source-aware mock run showing system inventory, workflow mapping, normalization, governance, and a recommended audit path.',
  },
  audit: {
    aria: 'AI Readiness Audit Workflow simulation',
    label: 'AI Readiness Audit Workflow',
    title: 'Watch a broad AI question become a concrete readiness roadmap.',
    subtitle:
      'A fast, source-aware mock run showing business intake, workflow inventory, readiness scoring, prioritization, and a recommended first sprint.',
  },
} as const;

const proposalSources = [
  { title: 'Competition portal', detail: 'Civic design brief' },
  { title: 'Government tender', detail: 'Public cultural center' },
  { title: 'Private RFP', detail: 'Mixed-use campus' },
  { title: 'Design competition', detail: 'Waterfront arts district' },
];

const proposalOpportunities = [
  { title: 'Waterfront Arts Center', type: 'Civic / Cultural', location: 'Toronto', deadline: '21 days', budget: '$42M scale' },
  { title: 'Library Commons Renewal', type: 'Adaptive reuse', location: 'Boston', deadline: '34 days', budget: '$18M scale' },
  { title: 'Design District Pavilion', type: 'Competition', location: 'Austin', deadline: '16 days', budget: '$8M scale' },
];

const proposalPrecedents = [
  { title: 'Harbor Arts Pavilion', match: 'Public realm + cultural destination' },
  { title: 'Riverfront Commons Library', match: 'Adaptive reuse + civic memory' },
  { title: 'Civic Learning Campus', match: 'Community programming + education' },
];

const operationalSources = [
  { title: 'CRM', status: 'synced' },
  { title: 'Project tool', status: 'indexed' },
  { title: 'Document archive', status: 'embedded' },
  { title: 'Calendar', status: 'synced' },
  { title: 'Email / tasks', status: 'indexed' },
];

const surfacedRecords = [
  { title: 'Project status note', detail: 'Rollout blocked by data import review' },
  { title: 'Decision log', detail: 'Security approval pending since Friday' },
  { title: 'Calendar hold', detail: 'Two stakeholder windows available' },
];

const subTasks = [
  'Summarize project status',
  'Identify blockers',
  'Draft update',
  'Schedule next-step meeting',
  'Update dashboard',
];

const proposalTypedLines = [
  'Analyzing portfolio alignment...',
  'Relevant precedents identified...',
  'Generating proposal support...',
  'Opportunity summary: waterfront civic arts center with public realm, adaptive reuse, and community programming requirements.',
  'Fit rationale: strong alignment with cultural work, civic storytelling, and waterfront precedent themes.',
  'Precedent explanation: Harbor Arts Pavilion and Riverfront Commons Library support the public access narrative.',
  'Proposal excerpt: lead with a concise design approach around civic memory, flexible programming, and durable public experience.',
];

const operationsTypedLines = [
  '@Agent update me on the Acme rollout and schedule next steps.',
  'Interpreting command...',
  'Searching connected records...',
  'Preparing actions for review...',
  'Interpreting request: project status, blockers, stakeholder availability, and leadership update required.',
  'Retrieved records: project notes, decision log, document review items, calendar windows, and open tasks.',
  'Final response: Acme rollout is 72 percent complete. Security approval is the active blocker. A draft update and next-step meeting plan are ready for review.',
];

const proposalReasoning = [
  { signal: '+ Similar portfolio work', detail: 'Civic cultural precedent and waterfront public realm work are strong matches.' },
  { signal: '+ Comparable project scale', detail: 'The opportunity sits within a scale the archive can support with credible references.' },
  { signal: '+ Relevant narrative material', detail: 'Existing project language supports public access, civic memory, and adaptive reuse themes.' },
  { signal: '- Procurement complexity', detail: 'Compressed Q+A and public tender requirements need principal review before pursuing.' },
];

const operationalReasoning = [
  { signal: 'Project deadline detected', detail: 'The rollout has a time-sensitive stakeholder review window.' },
  { signal: 'Meeting dependency identified', detail: 'Security approval needs a decision before the next milestone can move.' },
  { signal: 'Missing stakeholder update', detail: 'The system prepared a draft update but kept sending gated for review.' },
  { signal: 'Timeline conflict resolved', detail: 'Calendar availability was narrowed to two viable next-step windows.' },
];

const infrastructureSources = [
  { title: 'CRM export', detail: 'Client and opportunity records' },
  { title: 'Finance workbook', detail: 'Revenue and project billing' },
  { title: 'Shared drive', detail: 'Reports, PDFs, and templates' },
  { title: 'Operations tracker', detail: 'Tasks, status, and blockers' },
];

const infrastructureWorkflows = [
  { title: 'Monthly leadership reporting', detail: 'Manual export stitching', risk: 'high friction' },
  { title: 'Client status update', detail: 'Project facts spread across tools', risk: 'source drift' },
  { title: 'Document intelligence', detail: 'PDF value trapped outside databases', risk: 'unstructured' },
];

const infrastructureLayers = [
  { title: 'Entity model', detail: 'Client, project, report, owner' },
  { title: 'Source registry', detail: 'Freshness, owner, confidence' },
  { title: 'Access policy', detail: 'Internal, sensitive, external gates' },
];

const infrastructureTypedLines = [
  'Inventorying systems and shadow workflows...',
  'Normalizing critical records...',
  'Applying governance checks...',
  'Readiness summary: core business data is usable but scattered across exports, reports, and manually maintained trackers.',
  'Primary blocker: source ownership and metadata are inconsistent across reporting workflows.',
  'Audit path: start with reporting and document readiness, then build the first AI-ready workflow layer.',
];

const infrastructureReasoning = [
  { signal: '+ High-value workflow identified', detail: 'Leadership reporting depends on repeatable data and has visible business value.' },
  { signal: '+ Data sources are available', detail: 'The required records exist, but they need normalization and source ownership.' },
  { signal: '- Governance is immature', detail: 'Client-visible outputs and external effects need review gates before automation.' },
  { signal: 'Audit recommended', detail: 'A readiness audit can scope the first sprint without overcommitting to a platform rebuild.' },
];

const auditSignals = [
  { title: 'Leadership goals', status: 'captured' },
  { title: 'Workflow candidates', status: 'mapped' },
  { title: 'Data sources', status: 'scored' },
  { title: 'Governance risks', status: 'reviewed' },
  { title: 'Sprint options', status: 'ranked' },
];

const auditWorkflowCandidates = [
  { title: 'Leadership reporting', detail: 'Highest readiness, clear recurring value' },
  { title: 'Document intelligence', detail: 'Strong value, metadata gaps remain' },
  { title: 'BD follow-up layer', detail: 'Useful after contact and governance cleanup' },
];

const auditRoadmapTiers = [
  { title: 'Readiness cleanup', detail: 'Source ownership, metadata, access rules' },
  { title: 'Workflow sprint', detail: 'Reporting assistant with human review' },
  { title: 'Platform build', detail: 'Reusable state and intelligence layer' },
];

const auditTypedLines = [
  'Capturing business goals...',
  'Scoring workflow readiness...',
  'Ranking first-sprint options...',
  'Audit summary: leadership reporting is the strongest first workflow because the data exists and the business value is recurring.',
  'Risk note: document intelligence and BD follow-up should follow after metadata, access, and approval gates are clarified.',
  'Recommended next sprint: readiness cleanup plus a reporting intelligence prototype.',
];

const auditReasoning = [
  { signal: '+ Clear business value', detail: 'Reporting work is recurring, measurable, and visible to leadership.' },
  { signal: '+ Buildable first sprint', detail: 'The first workflow can start read-only with source-aware summaries.' },
  { signal: '- Data gaps remain', detail: 'Owner metadata and document structure need cleanup before broader automation.' },
  { signal: 'Human gates required', detail: 'External communications and client-visible outputs should stay approval-gated.' },
];

const defaultThinkingLabels = ['Analyzing context', 'Preparing response'];
const proposalThinkingLabels = ['Analyzing archive memory', 'Ranking precedent evidence', 'Drafting support language'];
const operationCommandThinkingLabels = ['Parsing user intent', 'Planning safe actions'];
const operationResponseThinkingLabels = ['Summarizing retrieved context', 'Preparing final response'];
const infrastructureThinkingLabels = ['Assessing source topology', 'Checking governance gaps', 'Preparing audit path'];
const auditThinkingLabels = ['Scoring readiness', 'Ranking workflow options', 'Drafting roadmap'];

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
};

const WorkflowSimulation: React.FC<WorkflowSimulationProps> = ({ mode }) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [phase, setPhase] = useState(0);
  const reducedMotion = useReducedMotion();
  const labels = phaseLabels[mode];
  const headerCopy = simulationHeaderCopy[mode];

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered((entered) => {
            if (!entered) setRunKey((current) => current + 1);
            return true;
          });
        }
      },
      { threshold: 0.32 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEntered) return undefined;

    if (reducedMotion) {
      setPhase(5);
      return undefined;
    }

    setPhase(0);
    const timers = [1, 2, 3, 4, 5].map((nextPhase) =>
      window.setTimeout(() => setPhase(nextPhase), nextPhase * 1150),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [hasEntered, reducedMotion, runKey]);

  const handleReplay = () => {
    setHasEntered(true);
    setRunKey((current) => current + 1);
  };

  return (
    <section
      ref={containerRef}
      className={`workflow-simulation workflow-simulation-${mode} ${hasEntered ? 'is-awake' : ''} theme-panel-strong relative overflow-hidden rounded-[32px] p-[24px] max-md:rounded-[24px] max-md:p-[14px]`}
      aria-label={headerCopy.aria}
    >
      <div className="workflow-simulation-grid-overlay" aria-hidden="true" />
      <div className="workflow-ambient-path workflow-ambient-path-a" aria-hidden="true" />
      <div className="workflow-ambient-path workflow-ambient-path-b" aria-hidden="true" />
      <div className="relative z-[1] mb-[18px] rounded-[24px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[18px] max-md:rounded-[20px] max-md:p-[14px]">
        <div className="flex flex-wrap items-start justify-between gap-[16px]">
          <div className="min-w-0 max-w-[820px]">
            <span className="inline-flex rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-[11px] py-[7px] font-diatype text-[10px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
              Capability Demonstration
            </span>
            <p className="mt-[14px] font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-accent)]">
              {headerCopy.label}
            </p>
            <h2 className="mt-[8px] max-w-[820px] break-words font-diatype text-[30px] font-semibold leading-[1.12] text-[var(--theme-text-primary)] max-md:text-[24px]">
              {headerCopy.title}
            </h2>
            <p className="mt-[10px] max-w-[760px] break-words font-diatype text-[14px] leading-[1.6] text-[var(--theme-text-secondary)]">
              {headerCopy.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReplay}
            className="capability-control-button shrink-0 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-[15px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-secondary)] transition hover:border-[var(--theme-border-strong)] hover:text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-soft)]"
          >
            Replay workflow
          </button>
        </div>
      </div>

      <div className="relative z-[1] mb-[16px] rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[10px]">
        <div className="grid grid-cols-5 gap-[8px] max-md:grid-cols-1">
          {labels.map((label, index) => (
            <div key={label} className={`workflow-phase-pill min-w-0 rounded-[14px] border px-[12px] py-[9px] ${phase >= index + 1 ? 'is-active' : ''}`}>
              <span className="block break-words font-diatype text-[10px] uppercase leading-[1.25] tracking-m3p">Stage {index + 1}</span>
              <span className="mt-[5px] block break-words font-diatype text-[12px] font-semibold leading-[1.25]">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-[10px] h-[6px] overflow-hidden rounded-full bg-[var(--theme-surface)]">
          <div
            className="animated-metric-fill h-full rounded-full bg-[var(--theme-accent)]"
            style={{ '--metric-width': `${Math.min(100, Math.max(4, (phase / 5) * 100))}%` } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="simulation-system-status relative z-[1] mb-[16px] flex flex-wrap items-center justify-between gap-[10px] rounded-[18px] border border-[var(--theme-border)] bg-[var(--theme-surface)] px-[14px] py-[12px]">
        <div className="flex min-w-0 items-center gap-[10px]">
          <SystemPulse active={phase > 0 && phase < 5} />
          <p className="min-w-0 break-words font-diatype text-[13px] leading-[1.35] text-[var(--theme-text-secondary)]">
            {phaseStatus[mode][phase]}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-[9px] py-[5px] font-diatype text-[10px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
          {phase === 5 ? 'Settled' : hasEntered ? 'Running' : 'Idle'}
        </span>
      </div>

      {mode === 'proposal' ? (
        <ProposalWorkflowSimulation phase={phase} runKey={runKey} reducedMotion={reducedMotion} />
      ) : mode === 'operations' ? (
        <OperationalWorkflowSimulation phase={phase} runKey={runKey} reducedMotion={reducedMotion} />
      ) : mode === 'infrastructure' ? (
        <InfrastructureWorkflowSimulation phase={phase} runKey={runKey} reducedMotion={reducedMotion} />
      ) : (
        <AuditWorkflowSimulation phase={phase} runKey={runKey} reducedMotion={reducedMotion} />
      )}

      <style jsx global>{`
        .workflow-simulation {
          min-height: 640px;
          border: 1px solid color-mix(in srgb, var(--theme-accent) 22%, var(--theme-border));
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .workflow-simulation-grid-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at 50% 20%, #000 0%, transparent 72%);
          opacity: 0.8;
        }

        .workflow-ambient-path {
          position: absolute;
          pointer-events: none;
          border: 1px solid color-mix(in srgb, var(--theme-accent) 16%, transparent);
          border-radius: 999px;
          opacity: 0.16;
          transform: translateZ(0);
        }

        .workflow-ambient-path-a {
          width: 56%;
          height: 34%;
          right: -18%;
          top: 18%;
          animation: ambientPathDrift 12s ease-in-out infinite;
        }

        .workflow-ambient-path-b {
          width: 46%;
          height: 42%;
          left: -15%;
          bottom: 6%;
          animation: ambientPathDrift 14s ease-in-out infinite reverse;
        }

        .workflow-simulation-operations .workflow-ambient-path {
          border-color: rgba(48, 214, 156, 0.18);
        }

        .workflow-simulation-infrastructure .workflow-ambient-path {
          border-color: rgba(185, 239, 239, 0.2);
        }

        .workflow-simulation-audit .workflow-ambient-path {
          border-color: rgba(248, 196, 113, 0.18);
        }

        .workflow-simulation::after {
          content: '';
          position: absolute;
          inset: 12px;
          border: 1px solid var(--theme-border);
          border-radius: 26px;
          pointer-events: none;
          opacity: 0.55;
        }

        .workflow-phase-pill {
          color: var(--theme-text-muted);
          border-color: var(--theme-border);
          background: var(--theme-surface-muted);
          transition: all 340ms ease;
        }

        .workflow-phase-pill.is-active {
          color: var(--theme-text-primary);
          border-color: color-mix(in srgb, var(--theme-accent) 42%, var(--theme-border));
          background: color-mix(in srgb, var(--theme-accent-soft) 34%, var(--theme-surface-muted));
          box-shadow: 0 0 28px var(--theme-accent-soft);
        }

        .simulation-card {
          border: 1px solid var(--theme-border);
          background: color-mix(in srgb, var(--theme-surface) 88%, transparent);
          box-shadow: 0 18px 54px rgba(0, 0, 0, 0.18);
          transition: all 420ms ease;
          min-width: 0;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .simulation-card.is-active {
          border-color: color-mix(in srgb, var(--theme-accent) 44%, var(--theme-border));
          box-shadow: 0 0 34px var(--theme-accent-soft), 0 22px 70px rgba(0, 0, 0, 0.24);
          background: color-mix(in srgb, var(--theme-accent-soft) 18%, var(--theme-surface));
        }

        .simulation-card.is-complete {
          border-color: rgba(74, 222, 128, 0.34);
          background: color-mix(in srgb, rgba(74, 222, 128, 0.08) 55%, var(--theme-surface));
        }

        .simulation-enter {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }

        .simulation-enter.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .simulation-status-dot {
          background: var(--theme-border-strong);
          transition: all 280ms ease;
        }

        .simulation-card.is-active .simulation-status-dot {
          background: var(--theme-accent);
          box-shadow: 0 0 20px var(--theme-accent-soft);
        }

        .simulation-card.is-complete .simulation-status-dot {
          background: #4ade80;
          box-shadow: 0 0 18px rgba(74, 222, 128, 0.22);
        }

        .system-pulse {
          position: relative;
          display: inline-flex;
          height: 16px;
          width: 16px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: var(--theme-accent-soft);
        }

        .system-pulse span {
          height: 7px;
          width: 7px;
          border-radius: 999px;
          background: var(--theme-accent);
          box-shadow: 0 0 18px var(--theme-accent-soft);
        }

        .system-pulse.is-active::after {
          content: '';
          position: absolute;
          inset: -5px;
          border: 1px solid color-mix(in srgb, var(--theme-accent) 44%, transparent);
          border-radius: 999px;
          animation: systemPulseRing 1.9s ease-out infinite;
        }

        .simulation-data-packet {
          position: absolute;
          z-index: 0;
          height: 8px;
          width: 8px;
          border-radius: 999px;
          background: var(--theme-accent);
          box-shadow: 0 0 20px var(--theme-accent-soft);
          opacity: 0;
          transform: translate3d(-20px, 10px, 0) scale(0.86);
          pointer-events: none;
        }

        .simulation-data-packet.is-active {
          animation: dataPacketTravel 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }

        .simulation-flow-line {
          position: absolute;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--theme-accent), transparent);
          transform-origin: left center;
          opacity: 0;
          transition: opacity 500ms ease, transform 500ms ease;
        }

        .simulation-flow-line.is-active {
          opacity: 0.8;
          animation: simulationPulseLine 1.5s ease-in-out infinite;
        }

        .typing-caret::after {
          content: '';
          display: inline-block;
          width: 7px;
          height: 1em;
          margin-left: 3px;
          background: var(--theme-accent);
          vertical-align: -2px;
          animation: simulationCaret 760ms steps(2, start) infinite;
        }

        .animated-metric-fill {
          width: var(--metric-width);
          transition: width 780ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .simulation-notification {
          opacity: 0;
          transform: translateY(12px);
          transition: all 420ms ease;
        }

        .simulation-notification.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .reasoning-panel {
          transition:
            opacity 320ms ease,
            border-color 320ms ease,
            background 320ms ease;
        }

        .reasoning-panel.is-disabled {
          opacity: 0.72;
        }

        .reasoning-panel-body {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition:
            grid-template-rows 360ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 240ms ease;
        }

        .reasoning-panel-body > div {
          overflow: hidden;
        }

        .reasoning-panel-body.is-open {
          grid-template-rows: 1fr;
          opacity: 1;
        }

        @keyframes simulationPulseLine {
          0%,
          100% {
            filter: drop-shadow(0 0 0 var(--theme-accent-soft));
          }
          50% {
            filter: drop-shadow(0 0 14px var(--theme-accent-soft));
          }
        }

        @keyframes simulationCaret {
          0%,
          45% {
            opacity: 1;
          }
          46%,
          100% {
            opacity: 0;
          }
        }

        @keyframes systemPulseRing {
          from {
            opacity: 0.58;
            transform: scale(0.75);
          }
          to {
            opacity: 0;
            transform: scale(1.45);
          }
        }

        @keyframes dataPacketTravel {
          0% {
            opacity: 0;
            transform: translate3d(-24px, 12px, 0) scale(0.84);
          }
          18% {
            opacity: 0.95;
          }
          100% {
            opacity: 0;
            transform: translate3d(96px, -32px, 0) scale(1);
          }
        }

        @keyframes ambientPathDrift {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(12px, -8px, 0) rotate(2deg);
          }
        }

        @media (max-width: 1023px) {
          .workflow-simulation {
            min-height: auto;
          }

          .workflow-simulation::after {
            inset: 8px;
            border-radius: 22px;
          }
        }

        @media (max-width: 767px) {
          .workflow-simulation {
            padding: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .simulation-card,
          .simulation-enter,
          .workflow-phase-pill,
          .workflow-ambient-path,
          .system-pulse.is-active::after,
          .simulation-data-packet,
          .reasoning-panel-body,
          .animated-metric-fill,
          .simulation-notification {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

const ProposalWorkflowSimulation: React.FC<{ phase: number; runKey: number; reducedMotion: boolean }> = ({
  phase,
  runKey,
  reducedMotion,
}) => {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const fitScore = phase >= 5 ? 91 : phase >= 4 ? 86 : phase >= 3 ? 72 : phase >= 2 ? 54 : 28;

  return (
    <div className="relative z-[1] grid grid-cols-[0.95fr_1.15fr_0.95fr] gap-[14px] max-lg:grid-cols-1">
      <div className="min-w-0 space-y-[12px]">
        <PanelLabel label="Opportunity sources" value={phase >= 1 ? 'Scanning feeds' : 'Waiting'} />
        {proposalSources.map((source, index) => (
          <SourceCard
            key={source.title}
            title={source.title}
            detail={source.detail}
            status={phase >= 2 ? (index < 2 ? 'classified' : 'normalized') : phase >= 1 ? 'scanning' : 'queued'}
            active={phase === 1}
            complete={phase >= 2}
            index={index}
          />
        ))}
      </div>

      <div className="relative min-h-[500px] min-w-0 overflow-hidden rounded-[26px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[16px] max-lg:min-h-0 max-md:rounded-[22px] max-md:p-[12px]">
        <DataFlowPacket className="left-[10%] top-[17%]" active={phase >= 2 && phase < 4} delay={0} />
        <DataFlowPacket className="left-[48%] top-[43%]" active={phase >= 3 && phase < 5} delay={140} />
        <DataFlowPacket className="left-[70%] top-[68%]" active={phase >= 4} delay={280} />
        <PanelLabel label="Extraction and matching" value={phase >= 3 ? 'Semantic match running' : phase >= 2 ? 'Opportunities extracted' : 'Normalizing'} />
        <div className="mt-[14px] grid grid-cols-1 gap-[10px]">
          {proposalOpportunities.map((opportunity, index) => (
            <div
              key={opportunity.title}
              className={`simulation-card simulation-enter rounded-[18px] p-[13px] ${phase >= 2 ? 'is-visible' : ''} ${index === 0 && phase >= 3 ? 'is-active' : ''}`}
              style={{ transitionDelay: `${index * 95}ms` }}
            >
              <div className="flex min-w-0 items-start justify-between gap-[10px] max-sm:flex-col">
                <div className="min-w-0">
                  <p className="break-words font-diatype text-[14px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{opportunity.title}</p>
                  <p className="mt-[5px] font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
                    {opportunity.type} / {opportunity.location}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--theme-border)] px-[8px] py-[5px] font-diatype text-[10px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
                  {opportunity.deadline}
                </span>
              </div>
              <p className="mt-[8px] font-diatype text-[12px] text-[var(--theme-text-secondary)]">{opportunity.budget}</p>
            </div>
          ))}
        </div>

        <div className={`simulation-flow-line left-[18%] top-[56%] w-[64%] rotate-[16deg] max-lg:hidden ${phase >= 3 ? 'is-active' : ''}`} />

        <div className="mt-[14px] rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[15px]">
          <div className="mb-[12px] flex items-center justify-between gap-[12px]">
            <span className="break-words font-diatype text-[11px] uppercase leading-[1.25] tracking-m3p text-[var(--theme-text-muted)]">Internal firm archive</span>
            <span className="shrink-0 font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-accent)]">{phase >= 3 ? '3 matches' : 'searching'}</span>
          </div>
          <div className="grid grid-cols-3 gap-[9px] max-sm:grid-cols-1">
            {proposalPrecedents.map((precedent, index) => (
              <div
                key={precedent.title}
                className={`simulation-card simulation-enter rounded-[16px] p-[11px] ${phase >= 3 ? 'is-visible is-complete' : ''}`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <p className="font-diatype text-[12px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{precedent.title}</p>
                <p className="mt-[8px] font-diatype text-[11px] leading-[1.35] text-[var(--theme-text-muted)]">{precedent.match}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[14px] grid grid-cols-[0.6fr_1fr] gap-[10px] max-sm:grid-cols-1">
          <AnimatedMetric label="Fit score" value={`${fitScore}%`} progress={fitScore} active={phase >= 3} />
          <div className="min-w-0 rounded-[18px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[13px]">
            <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Match signals</p>
            <p className="mt-[8px] break-words font-diatype text-[13px] leading-[1.45] text-[var(--theme-text-secondary)]">
              Civic destination, waterfront public realm, adaptive reuse, cultural programming.
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-[12px]">
        <PanelLabel label="Generated output" value={phase >= 5 ? 'Review ready' : phase >= 4 ? 'Typing' : 'Waiting'} />
        <div className="simulation-card rounded-[22px] p-[16px]">
          <TypingLine
            key={`proposal-typing-${runKey}-${phase}`}
            active={phase >= 4}
            lines={proposalTypedLines}
            reducedMotion={reducedMotion}
            thinkingLabels={proposalThinkingLabels}
          />
        </div>
        <div className={`simulation-notification rounded-[22px] border border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.1)] p-[16px] ${phase >= 5 ? 'is-visible' : ''}`}>
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Pursuit recommendation</p>
          <p className="mt-[8px] font-diatype text-[24px] font-semibold text-[var(--theme-text-primary)]">Strong Fit / Pursue</p>
          <div className="mt-[12px] space-y-[7px] break-words font-diatype text-[12px] leading-[1.45] text-[var(--theme-text-secondary)]">
            <p>Top precedents: Harbor Arts Pavilion, Riverfront Commons Library.</p>
            <p>Suggested sections: design approach, relevant experience, team narrative, public-realm strategy.</p>
          </div>
        </div>
        <ReasoningPanel
          title="Why this opportunity is a strong fit"
          isOpen={reasoningOpen}
          onToggle={() => setReasoningOpen((open) => !open)}
          items={proposalReasoning}
          disabled={phase < 5}
        />
      </div>
    </div>
  );
};

const OperationalWorkflowSimulation: React.FC<{ phase: number; runKey: number; reducedMotion: boolean }> = ({
  phase,
  runKey,
  reducedMotion,
}) => {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const dashboardProgress = phase >= 5 ? 72 : phase >= 4 ? 58 : phase >= 3 ? 37 : 12;

  return (
    <div className="relative z-[1] grid grid-cols-[0.95fr_1.1fr_0.95fr] gap-[14px] max-lg:grid-cols-1">
      <div className="min-w-0 space-y-[12px]">
        <PanelLabel label="Connected systems" value={phase >= 1 ? 'Syncing workspace' : 'Waiting'} />
        {operationalSources.map((source, index) => (
          <SyncStatusCard
            key={source.title}
            title={source.title}
            status={phase >= 2 ? source.status : phase >= 1 ? index < 3 ? 'indexing' : 'connecting' : 'queued'}
            active={phase === 1}
            complete={phase >= 2}
            index={index}
          />
        ))}
      </div>

      <div className="relative min-w-0 overflow-hidden rounded-[26px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[16px] max-md:rounded-[22px] max-md:p-[12px]">
        <DataFlowPacket className="left-[14%] top-[18%]" active={phase >= 2 && phase < 4} delay={0} />
        <DataFlowPacket className="left-[46%] top-[50%]" active={phase >= 3 && phase < 5} delay={150} />
        <DataFlowPacket className="left-[72%] top-[74%]" active={phase >= 4} delay={300} />
        <PanelLabel label="Agent command center" value={phase >= 3 ? 'Retrieving data' : phase >= 2 ? 'Interpreting command' : 'Ready'} />
        <div className="mt-[14px] simulation-card rounded-[22px] p-[15px]">
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Chat request</p>
          <div className="mt-[12px] rounded-[18px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[13px]">
            <TypingLine
              key={`ops-command-${runKey}-${phase}`}
              active={phase >= 2}
              lines={[operationsTypedLines[0]]}
              reducedMotion={reducedMotion}
              thinkingLabels={operationCommandThinkingLabels}
              compact
            />
          </div>
        </div>

        <div className="mt-[12px] grid grid-cols-3 gap-[9px] max-sm:grid-cols-1">
          {surfacedRecords.map((record, index) => (
            <div
              key={record.title}
              className={`simulation-card simulation-enter rounded-[16px] p-[12px] ${phase >= 3 ? 'is-visible is-active' : ''}`}
              style={{ transitionDelay: `${index * 110}ms` }}
            >
              <p className="font-diatype text-[12px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{record.title}</p>
              <p className="mt-[8px] font-diatype text-[11px] leading-[1.38] text-[var(--theme-text-muted)]">{record.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-[12px] rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[15px]">
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Agent subtasks</p>
          <div className="mt-[12px] space-y-[8px]">
            {subTasks.map((task, index) => (
              <div
                key={task}
                className={`simulation-card simulation-enter flex items-center gap-[9px] rounded-[14px] px-[11px] py-[9px] ${phase >= 4 ? 'is-visible is-complete' : ''}`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="simulation-status-dot h-[8px] w-[8px] shrink-0 rounded-full" />
                <span className="font-diatype text-[12px] text-[var(--theme-text-secondary)]">{task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-[12px]">
        <PanelLabel label="Dashboard and response" value={phase >= 5 ? 'Updated' : phase >= 4 ? 'Actions staged' : 'Waiting'} />
        <div className="simulation-card rounded-[22px] p-[16px]">
          <div className="grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
            <AnimatedMetric label="Rollout progress" value={`${dashboardProgress}%`} progress={dashboardProgress} active={phase >= 5} />
            <AnimatedMetric label="Blocker risk" value={phase >= 5 ? '1' : '3'} progress={phase >= 5 ? 28 : 74} active={phase >= 5} />
          </div>
          <div className={`simulation-notification mt-[12px] rounded-[18px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[13px] ${phase >= 5 ? 'is-visible' : ''}`}>
            <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Timeline update</p>
            <p className="mt-[8px] break-words font-diatype text-[13px] leading-[1.45] text-[var(--theme-text-secondary)]">
              Stakeholder review added for Thursday. Security approval remains the critical path.
            </p>
          </div>
        </div>

        <div className={`simulation-notification rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[16px] ${phase >= 5 ? 'is-visible' : ''}`}>
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Agent response</p>
          <div className="mt-[11px]">
            <TypingLine
              key={`ops-response-${runKey}-${phase}`}
              active={phase >= 5}
              lines={[operationsTypedLines[6]]}
              reducedMotion={reducedMotion}
              thinkingLabels={operationResponseThinkingLabels}
            />
          </div>
        </div>
        <ReasoningPanel
          title="Why these actions were taken"
          isOpen={reasoningOpen}
          onToggle={() => setReasoningOpen((open) => !open)}
          items={operationalReasoning}
          disabled={phase < 5}
        />
      </div>
    </div>
  );
};

const InfrastructureWorkflowSimulation: React.FC<{ phase: number; runKey: number; reducedMotion: boolean }> = ({
  phase,
  runKey,
  reducedMotion,
}) => {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const readinessScore = phase >= 5 ? 74 : phase >= 4 ? 62 : phase >= 3 ? 48 : phase >= 2 ? 31 : 18;
  const blockerCount = phase >= 5 ? 14 : phase >= 4 ? 16 : phase >= 3 ? 19 : 22;

  return (
    <div className="relative z-[1] grid grid-cols-[0.95fr_1.1fr_0.95fr] gap-[14px] max-lg:grid-cols-1">
      <div className="min-w-0 space-y-[12px]">
        <PanelLabel label="Fragmented sources" value={phase >= 1 ? 'Inventorying' : 'Waiting'} />
        {infrastructureSources.map((source, index) => (
          <SourceCard
            key={source.title}
            title={source.title}
            detail={source.detail}
            status={phase >= 2 ? (index < 2 ? 'mapped' : 'classified') : phase >= 1 ? 'scanning' : 'queued'}
            active={phase === 1}
            complete={phase >= 2}
            index={index}
          />
        ))}
      </div>

      <div className="relative min-w-0 overflow-hidden rounded-[26px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[16px] max-md:rounded-[22px] max-md:p-[12px]">
        <DataFlowPacket className="left-[12%] top-[18%]" active={phase >= 2 && phase < 4} delay={0} />
        <DataFlowPacket className="left-[48%] top-[46%]" active={phase >= 3 && phase < 5} delay={150} />
        <DataFlowPacket className="left-[74%] top-[70%]" active={phase >= 4} delay={300} />
        <PanelLabel label="Readiness topology" value={phase >= 4 ? 'Governance applied' : phase >= 3 ? 'Normalizing' : phase >= 2 ? 'Workflow map' : 'Ready'} />

        <div className="mt-[14px] grid grid-cols-3 gap-[9px] max-sm:grid-cols-1">
          {infrastructureWorkflows.map((workflow, index) => (
            <div
              key={workflow.title}
              className={`simulation-card simulation-enter rounded-[16px] p-[12px] ${phase >= 2 ? 'is-visible is-active' : ''}`}
              style={{ transitionDelay: `${index * 105}ms` }}
            >
              <p className="break-words font-diatype text-[12px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{workflow.title}</p>
              <p className="mt-[8px] break-words font-diatype text-[11px] leading-[1.38] text-[var(--theme-text-muted)]">{workflow.detail}</p>
              <p className="mt-[9px] font-diatype text-[10px] uppercase tracking-m3p text-[var(--theme-accent)]">{workflow.risk}</p>
            </div>
          ))}
        </div>

        <div className={`simulation-flow-line left-[12%] top-[48%] w-[72%] rotate-[10deg] max-lg:hidden ${phase >= 3 ? 'is-active' : ''}`} />

        <div className="mt-[12px] rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[15px]">
          <div className="mb-[12px] flex min-w-0 items-center justify-between gap-[12px]">
            <span className="break-words font-diatype text-[11px] uppercase leading-[1.25] tracking-m3p text-[var(--theme-text-muted)]">AI-ready infrastructure layer</span>
            <span className="shrink-0 font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-accent)]">{phase >= 4 ? 'governed' : 'assembling'}</span>
          </div>
          <div className="grid grid-cols-3 gap-[9px] max-sm:grid-cols-1">
            {infrastructureLayers.map((layer, index) => (
              <div
                key={layer.title}
                className={`simulation-card simulation-enter rounded-[16px] p-[11px] ${phase >= 3 ? 'is-visible is-complete' : ''}`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <p className="font-diatype text-[12px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{layer.title}</p>
                <p className="mt-[8px] break-words font-diatype text-[11px] leading-[1.35] text-[var(--theme-text-muted)]">{layer.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[12px] grid grid-cols-2 gap-[10px] max-sm:grid-cols-1">
          <AnimatedMetric label="Readiness score" value={`${readinessScore}%`} progress={readinessScore} active={phase >= 3} />
          <AnimatedMetric label="Blockers surfaced" value={`${blockerCount}`} progress={Math.min(100, blockerCount * 4)} active={phase >= 4} />
        </div>
      </div>

      <div className="min-w-0 space-y-[12px]">
        <PanelLabel label="Audit recommendation" value={phase >= 5 ? 'Ready' : phase >= 4 ? 'Typing' : 'Waiting'} />
        <div className="simulation-card rounded-[22px] p-[16px]">
          <TypingLine
            key={`infrastructure-typing-${runKey}-${phase}`}
            active={phase >= 4}
            lines={infrastructureTypedLines}
            reducedMotion={reducedMotion}
            thinkingLabels={infrastructureThinkingLabels}
          />
        </div>
        <div className={`simulation-notification rounded-[22px] border border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.1)] p-[16px] ${phase >= 5 ? 'is-visible' : ''}`}>
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Recommended next step</p>
          <p className="mt-[8px] font-diatype text-[24px] font-semibold leading-[1.1] text-[var(--theme-text-primary)]">Start AI Readiness Audit</p>
          <div className="mt-[12px] space-y-[7px] break-words font-diatype text-[12px] leading-[1.45] text-[var(--theme-text-secondary)]">
            <p>First focus: reporting workflow, document source inventory, governance boundaries.</p>
            <p>Output: audit roadmap and first AI-ready workflow sprint recommendation.</p>
          </div>
        </div>
        <ReasoningPanel
          title="Why infrastructure readiness comes first"
          isOpen={reasoningOpen}
          onToggle={() => setReasoningOpen((open) => !open)}
          items={infrastructureReasoning}
          disabled={phase < 5}
        />
      </div>
    </div>
  );
};

const AuditWorkflowSimulation: React.FC<{ phase: number; runKey: number; reducedMotion: boolean }> = ({
  phase,
  runKey,
  reducedMotion,
}) => {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const auditConfidence = phase >= 5 ? 82 : phase >= 4 ? 73 : phase >= 3 ? 61 : phase >= 2 ? 42 : 24;

  return (
    <div className="relative z-[1] grid grid-cols-[0.95fr_1.1fr_0.95fr] gap-[14px] max-lg:grid-cols-1">
      <div className="min-w-0 space-y-[12px]">
        <PanelLabel label="Audit intake" value={phase >= 1 ? 'Capturing signals' : 'Waiting'} />
        {auditSignals.map((signal, index) => (
          <SyncStatusCard
            key={signal.title}
            title={signal.title}
            status={phase >= 2 ? signal.status : phase >= 1 ? 'reviewing' : 'queued'}
            active={phase === 1}
            complete={phase >= 2}
            index={index}
          />
        ))}
      </div>

      <div className="relative min-w-0 overflow-hidden rounded-[26px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[16px] max-md:rounded-[22px] max-md:p-[12px]">
        <DataFlowPacket className="left-[16%] top-[20%]" active={phase >= 2 && phase < 4} delay={0} />
        <DataFlowPacket className="left-[50%] top-[48%]" active={phase >= 3 && phase < 5} delay={150} />
        <DataFlowPacket className="left-[74%] top-[72%]" active={phase >= 4} delay={300} />
        <PanelLabel label="Readiness scoring" value={phase >= 4 ? 'Prioritizing options' : phase >= 3 ? 'Scoring readiness' : phase >= 2 ? 'Inventory complete' : 'Ready'} />

        <div className="mt-[14px] grid grid-cols-3 gap-[9px] max-sm:grid-cols-1">
          {auditWorkflowCandidates.map((candidate, index) => (
            <div
              key={candidate.title}
              className={`simulation-card simulation-enter rounded-[16px] p-[12px] ${phase >= 3 ? 'is-visible is-active' : ''}`}
              style={{ transitionDelay: `${index * 110}ms` }}
            >
              <p className="break-words font-diatype text-[12px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{candidate.title}</p>
              <p className="mt-[8px] break-words font-diatype text-[11px] leading-[1.38] text-[var(--theme-text-muted)]">{candidate.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-[12px] grid grid-cols-[0.65fr_1fr] gap-[10px] max-sm:grid-cols-1">
          <AnimatedMetric label="Audit confidence" value={`${auditConfidence}%`} progress={auditConfidence} active={phase >= 3} />
          <div className="min-w-0 rounded-[18px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[13px]">
            <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Highest-readiness signal</p>
            <p className="mt-[8px] break-words font-diatype text-[13px] leading-[1.45] text-[var(--theme-text-secondary)]">
              Leadership reporting has recurring value, available source records, and a low-risk read-only starting point.
            </p>
          </div>
        </div>

        <div className="mt-[12px] rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[15px]">
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Roadmap tiers</p>
          <div className="mt-[12px] space-y-[8px]">
            {auditRoadmapTiers.map((tier, index) => (
              <div
                key={tier.title}
                className={`simulation-card simulation-enter flex min-w-0 items-start gap-[10px] rounded-[14px] px-[11px] py-[10px] ${phase >= 4 ? 'is-visible is-complete' : ''}`}
                style={{ transitionDelay: `${index * 95}ms` }}
              >
                <span className="simulation-status-dot mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full" />
                <span className="min-w-0">
                  <span className="block break-words font-diatype text-[12px] font-semibold leading-[1.25] text-[var(--theme-text-primary)]">{tier.title}</span>
                  <span className="mt-[4px] block break-words font-diatype text-[11px] leading-[1.35] text-[var(--theme-text-muted)]">{tier.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-[12px]">
        <PanelLabel label="Audit roadmap" value={phase >= 5 ? 'Review ready' : phase >= 4 ? 'Typing' : 'Waiting'} />
        <div className="simulation-card rounded-[22px] p-[16px]">
          <TypingLine
            key={`audit-typing-${runKey}-${phase}`}
            active={phase >= 4}
            lines={auditTypedLines}
            reducedMotion={reducedMotion}
            thinkingLabels={auditThinkingLabels}
          />
        </div>
        <div className={`simulation-notification rounded-[22px] border border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.1)] p-[16px] ${phase >= 5 ? 'is-visible' : ''}`}>
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Recommended first sprint</p>
          <p className="mt-[8px] font-diatype text-[24px] font-semibold leading-[1.1] text-[var(--theme-text-primary)]">Reporting Intelligence Prototype</p>
          <div className="mt-[12px] space-y-[7px] break-words font-diatype text-[12px] leading-[1.45] text-[var(--theme-text-secondary)]">
            <p>Start read-only: source-aware summaries, readiness cleanup, and executive dashboard output.</p>
            <p>Hold external sends, publishing, CRM writes, and automated updates for later approval-gated phases.</p>
          </div>
        </div>
        <ReasoningPanel
          title="Why this audit path is recommended"
          isOpen={reasoningOpen}
          onToggle={() => setReasoningOpen((open) => !open)}
          items={auditReasoning}
          disabled={phase < 5}
        />
      </div>
    </div>
  );
};

const PanelLabel: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex min-w-0 items-center justify-between gap-[12px] max-sm:items-start">
    <span className="min-w-0 break-words font-diatype text-[11px] uppercase leading-[1.25] tracking-m3p text-[var(--theme-text-muted)]">{label}</span>
    <span className="shrink-0 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-[9px] py-[5px] font-diatype text-[10px] uppercase leading-[1.2] tracking-m3p text-[var(--theme-text-muted)]">
      {value}
    </span>
  </div>
);

const SystemPulse: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`system-pulse ${active ? 'is-active' : ''}`} aria-hidden="true">
    <span />
  </span>
);

const DataFlowPacket: React.FC<{ active: boolean; className: string; delay: number }> = ({
  active,
  className,
  delay,
}) => (
  <span
    className={`simulation-data-packet ${className} ${active ? 'is-active' : ''}`}
    style={{ animationDelay: `${delay}ms` }}
    aria-hidden="true"
  />
);

const ReasoningPanel: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  items: { signal: string; detail: string }[];
  disabled: boolean;
}> = ({ title, isOpen, onToggle, items, disabled }) => (
  <div className={`reasoning-panel mt-[12px] rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[14px] ${disabled ? 'is-disabled' : ''}`}>
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-[12px] text-left focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-soft)]"
    >
      <span className="min-w-0 break-words font-diatype text-[13px] font-semibold leading-[1.35] text-[var(--theme-text-primary)]">
        {title}
      </span>
      <span className="shrink-0 rounded-full border border-[var(--theme-border)] px-[9px] py-[5px] font-diatype text-[10px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
        {disabled ? 'Resolving' : isOpen ? 'Hide' : 'Explain'}
      </span>
    </button>
    <div className={`reasoning-panel-body ${isOpen && !disabled ? 'is-open' : ''}`}>
      <div className="mt-[12px] space-y-[8px]">
        {items.map((item, index) => (
          <div
            key={item.signal}
            className="rounded-[14px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-[11px] py-[10px]"
            style={{ transitionDelay: `${index * 70}ms` }}
          >
            <p className="break-words font-diatype text-[12px] font-semibold leading-[1.35] text-[var(--theme-text-primary)]">{item.signal}</p>
            <p className="mt-[5px] break-words font-diatype text-[11px] leading-[1.45] text-[var(--theme-text-secondary)]">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SourceCard: React.FC<SourceCardProps> = ({ title, detail, status, active, complete, index }) => (
  <div
    className={`simulation-card simulation-enter rounded-[18px] p-[13px] ${active || complete ? 'is-visible' : ''} ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}
    style={{ transitionDelay: `${index * 110}ms` }}
  >
    <div className="flex min-w-0 items-start justify-between gap-[10px]">
      <div className="min-w-0">
        <p className="break-words font-diatype text-[14px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{title}</p>
        <p className="mt-[5px] break-words font-diatype text-[12px] leading-[1.35] text-[var(--theme-text-muted)]">{detail}</p>
      </div>
      <span className="simulation-status-dot mt-[4px] h-[8px] w-[8px] shrink-0 rounded-full" />
    </div>
    <p className="mt-[10px] break-words font-diatype text-[10px] uppercase leading-[1.25] tracking-m3p text-[var(--theme-text-muted)]">{status}</p>
  </div>
);

const SyncStatusCard: React.FC<SyncStatusCardProps> = ({ title, status, active, complete, index }) => (
  <div
    className={`simulation-card simulation-enter rounded-[18px] p-[13px] ${active || complete ? 'is-visible' : ''} ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}
    style={{ transitionDelay: `${index * 95}ms` }}
  >
    <div className="flex min-w-0 items-center justify-between gap-[12px]">
      <span className="min-w-0 break-words font-diatype text-[14px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{title}</span>
      <span className="simulation-status-dot h-[8px] w-[8px] rounded-full" />
    </div>
    <div className="mt-[10px] h-[6px] overflow-hidden rounded-full bg-[var(--theme-surface-muted)]">
      <div
        className="animated-metric-fill h-full rounded-full bg-[var(--theme-accent)]"
        style={{ '--metric-width': complete ? '100%' : active ? '62%' : '8%' } as React.CSSProperties}
      />
    </div>
    <p className="mt-[9px] break-words font-diatype text-[10px] uppercase leading-[1.25] tracking-m3p text-[var(--theme-text-muted)]">{status}</p>
  </div>
);

const AnimatedMetric: React.FC<AnimatedMetricProps> = ({ label, value, progress, active }) => (
  <div className={`min-w-0 rounded-[18px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[13px] ${active ? 'is-active' : ''}`}>
    <div className="flex min-w-0 items-end justify-between gap-[10px]">
      <p className="min-w-0 break-words font-diatype text-[10px] uppercase leading-[1.25] tracking-m3p text-[var(--theme-text-muted)]">{label}</p>
      <MetricCounter value={value} active={active} />
    </div>
    <div className="mt-[10px] h-[7px] overflow-hidden rounded-full bg-[var(--theme-surface-muted)]">
      <div
        className="animated-metric-fill h-full rounded-full bg-[var(--theme-accent)]"
        style={{ '--metric-width': `${Math.max(4, Math.min(progress, 100))}%` } as React.CSSProperties}
      />
    </div>
  </div>
);

const MetricCounter: React.FC<{ value: string; active: boolean }> = ({ value, active }) => {
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? Number(match[1]) : null;
  const suffix = match ? match[2] : '';
  const [displayValue, setDisplayValue] = useState(target ?? 0);

  useEffect(() => {
    if (target === null) return undefined;
    if (!active) {
      setDisplayValue(target);
      return undefined;
    }

    let frame = 0;
    let animationFrame = 0;
    const totalFrames = 36;
    const start = Math.max(0, target * 0.55);

    const tick = () => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + (target - start) * eased);
      if (progress < 1) animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [active, target]);

  if (target === null) {
    return <p className="shrink-0 font-diatype text-[20px] font-semibold text-[var(--theme-text-primary)]">{value}</p>;
  }

  return (
    <p className="shrink-0 font-diatype text-[20px] font-semibold text-[var(--theme-text-primary)]">
      {Math.round(displayValue)}
      {suffix}
    </p>
  );
};

const TypingLine: React.FC<{
  active: boolean;
  lines: string[];
  reducedMotion: boolean;
  compact?: boolean;
  thinkingLabels?: string[];
}> = ({ active, lines, reducedMotion, compact = false, thinkingLabels = defaultThinkingLabels }) => {
  const fullText = useMemo(() => lines.join('\n\n'), [lines]);
  const [visibleText, setVisibleText] = useState(reducedMotion || active ? fullText : '');
  const [thinkingIndex, setThinkingIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setVisibleText('');
      return undefined;
    }

    if (reducedMotion) {
      setVisibleText(fullText);
      return undefined;
    }

    setVisibleText('');
    setThinkingIndex(0);
    let index = 0;
    let timeout = 0;
    const tick = () => {
      index += compact ? 3 : 4;
      setVisibleText(fullText.slice(0, index));
      setThinkingIndex(Math.min(thinkingLabels.length - 1, Math.floor((index / Math.max(fullText.length, 1)) * thinkingLabels.length)));
      if (index >= fullText.length) return;

      const char = fullText[index - 1] ?? '';
      const punctuationPause = ['.', ':', '\n'].includes(char) ? 170 : 0;
      const rhythm = index % 19 === 0 ? 90 : index % 7 === 0 ? 38 : 0;
      timeout = window.setTimeout(tick, (compact ? 22 : 28) + punctuationPause + rhythm);
    };

    timeout = window.setTimeout(tick, 360);

    return () => window.clearTimeout(timeout);
  }, [active, compact, fullText, reducedMotion, thinkingLabels]);

  if (!active && !visibleText) {
    return (
      <p className="break-words font-diatype text-[13px] leading-[1.6] text-[var(--theme-text-muted)]">
        Awaiting upstream context...
      </p>
    );
  }

  return (
    <div>
      {active && visibleText.length < fullText.length ? (
        <div className="mb-[10px] flex items-center gap-[8px] rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-[10px] py-[6px]">
          <SystemPulse active />
          <span className="break-words font-diatype text-[10px] uppercase leading-[1.25] tracking-m3p text-[var(--theme-text-muted)]">
            {thinkingLabels[thinkingIndex]}
          </span>
        </div>
      ) : null}
      <p className={`whitespace-pre-line break-words font-diatype ${compact ? 'text-[13px]' : 'text-[13px]'} leading-[1.6] text-[var(--theme-text-secondary)] ${active && visibleText.length < fullText.length ? 'typing-caret' : ''}`}>
        {visibleText}
      </p>
    </div>
  );
};

export default WorkflowSimulation;
