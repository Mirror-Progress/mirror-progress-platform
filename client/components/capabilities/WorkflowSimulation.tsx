import {
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CapabilityExperience,
  CapabilityMode,
} from '../../lib/capability-experiences';

type WorkflowSimulationProps = {
  experience: CapabilityExperience;
};

const STAGE_MS = 1450;

function useCapabilitySequence(stageCount: number) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setStage(stageCount - 1);
      setPlaying(false);
      setHasEntered(true);
      return undefined;
    }

    const element = rootRef.current;
    if (!element || hasEntered) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          setPlaying(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasEntered, reducedMotion, stageCount]);

  useEffect(() => {
    if (!playing || reducedMotion) return undefined;
    if (stage >= stageCount - 1) {
      setPlaying(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setStage((current) => Math.min(current + 1, stageCount - 1));
    }, STAGE_MS);
    return () => window.clearTimeout(timer);
  }, [playing, reducedMotion, stage, stageCount]);

  const replay = useCallback(() => {
    if (reducedMotion) {
      setStage(stageCount - 1);
      return;
    }
    setStage(0);
    setPlaying(true);
  }, [reducedMotion, stageCount]);

  const chooseStage = useCallback((index: number) => {
    setStage(index);
    setPlaying(false);
  }, []);

  return {
    rootRef,
    stage,
    playing,
    reducedMotion,
    setPlaying,
    replay,
    chooseStage,
  };
}

const WorkflowSimulation: React.FC<WorkflowSimulationProps> = ({
  experience,
}) => {
  const sequence = useCapabilitySequence(experience.sceneStages.length);
  const activeStage = experience.sceneStages[sequence.stage];

  return (
    <div
      ref={sequence.rootRef}
      className={`capability-scene capability-scene-${experience.mode}`}
      aria-label={`${experience.title} interactive demonstration`}
    >
      <div className="capability-scene-head">
        <div>
          <p className="capability-scene-kicker">{experience.sceneLabel}</p>
          <p className="capability-scene-status" aria-live="polite">
            {activeStage.status}
          </p>
        </div>
        <div className="capability-scene-controls">
          <button
            type="button"
            className="capability-icon-button"
            onClick={() => sequence.setPlaying((current) => !current)}
            disabled={sequence.reducedMotion}
            aria-label={sequence.playing ? 'Pause demonstration' : 'Play demonstration'}
            title={sequence.playing ? 'Pause' : 'Play'}
          >
            {sequence.playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="capability-icon-button"
            onClick={sequence.replay}
            aria-label="Replay demonstration"
            title="Replay"
          >
            <ArrowPathIcon />
          </button>
        </div>
      </div>

      <div className="capability-scene-canvas">
        <Scene mode={experience.mode} stage={sequence.stage} />
      </div>

      <div className="capability-stage-nav" aria-label="Demonstration stages">
        {experience.sceneStages.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === sequence.stage ? 'is-active' : ''}
            onClick={() => sequence.chooseStage(index)}
            aria-current={index === sequence.stage ? 'step' : undefined}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {item.label}
          </button>
        ))}
      </div>

      <p className="capability-scene-note">
        Illustrative example using mock business information.
      </p>
    </div>
  );
};

const Scene: React.FC<{ mode: CapabilityMode; stage: number }> = ({
  mode,
  stage,
}) => {
  switch (mode) {
    case 'proposal':
      return <ProposalScene stage={stage} />;
    case 'operations':
      return <OperationsScene stage={stage} />;
    case 'infrastructure':
      return <InfrastructureScene stage={stage} />;
    case 'audit':
      return <AuditScene stage={stage} />;
  }
};

const AuditScene: React.FC<{ stage: number }> = ({ stage }) => {
  const candidates = [
    { name: 'Client reporting', value: 88, ready: 82, risk: 22 },
    { name: 'Document intake', value: 76, ready: 64, risk: 34 },
    { name: 'Forecast review', value: 69, ready: 41, risk: 58 },
  ];

  return (
    <div className="audit-scene">
      <div className={`audit-pressure reveal-${Math.min(stage, 1)}`}>
        <span>Business pressure</span>
        <strong>Reporting takes 3 days every month</strong>
      </div>
      <div className="audit-matrix">
        <div className="audit-matrix-head">
          <span>Candidate workflow</span><span>Value</span><span>Ready</span><span>Risk</span>
        </div>
        {candidates.map((candidate, index) => (
          <div
            key={candidate.name}
            className={`audit-row ${stage >= 1 ? 'is-visible' : ''} ${
              stage >= 3 && index === 0 ? 'is-selected' : ''
            }`}
            style={{ '--row-delay': `${index * 90}ms` } as React.CSSProperties}
          >
            <strong>{candidate.name}</strong>
            {[candidate.value, candidate.ready, candidate.risk].map((score, scoreIndex) => (
              <div className="score-cell" key={`${candidate.name}-${scoreIndex}`}>
                <span
                  className={scoreIndex === 2 ? 'is-risk' : ''}
                  style={{ width: stage >= 2 ? `${score}%` : '0%' }}
                />
                <small>{stage >= 2 ? score : '—'}</small>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={`audit-recommendation ${stage >= 4 ? 'is-visible' : ''}`}>
        <span>Recommended first sprint</span>
        <strong>Automate the monthly client reporting workflow</strong>
        <small>High value · information ready · controlled risk</small>
      </div>
    </div>
  );
};

const InfrastructureScene: React.FC<{ stage: number }> = ({ stage }) => {
  const systems = [
    ['CRM', '32 duplicate records'],
    ['Shared drive', '418 mixed files'],
    ['Finance sheet', 'Manual monthly export'],
    ['Project tool', 'Owners incomplete'],
  ];

  return (
    <div className="infrastructure-scene">
      <div className="system-map">
        {systems.map(([name, detail], index) => (
          <div
            key={name}
            className={`system-node system-node-${index + 1} ${stage >= 0 ? 'is-visible' : ''} ${
              stage >= 2 ? 'is-organized' : ''
            }`}
          >
            <span>{name}</span><small>{detail}</small>
          </div>
        ))}
        <svg viewBox="0 0 600 330" aria-hidden="true">
          <path className={stage >= 1 ? 'is-visible' : ''} d="M125 80 C230 80 205 165 300 165" />
          <path className={stage >= 1 ? 'is-visible' : ''} d="M475 80 C370 80 395 165 300 165" />
          <path className={stage >= 1 ? 'is-visible' : ''} d="M125 260 C230 260 205 165 300 165" />
          <path className={stage >= 1 ? 'is-visible' : ''} d="M475 260 C370 260 395 165 300 165" />
        </svg>
        <div className={`foundation-core ${stage >= 2 ? 'is-visible' : ''}`}>
          <span>Connected records</span>
          <strong>One reliable workflow</strong>
          <small className={stage >= 3 ? 'is-visible' : ''}>Ownership · access · freshness</small>
        </div>
      </div>
      <div className={`foundation-output ${stage >= 4 ? 'is-visible' : ''}`}>
        <span>AI-ready foundation</span>
        <strong>Client reporting can now use governed information</strong>
      </div>
    </div>
  );
};

const OperationsScene: React.FC<{ stage: number }> = ({ stage }) => {
  const signals = ['Projects', 'Tasks', 'Documents', 'Decisions'];
  const priorities = [
    ['Security review', 'Blocked · 6 days', 'high'],
    ['Client approval', 'Awaiting response', 'medium'],
    ['Milestone brief', 'Owner missing', 'medium'],
  ];

  return (
    <div className="operations-scene">
      <div className="operations-sources">
        {signals.map((signal, index) => (
          <span
            key={signal}
            className={stage >= 0 ? 'is-visible' : ''}
            style={{ '--row-delay': `${index * 70}ms` } as React.CSSProperties}
          >
            <i />{signal}
          </span>
        ))}
      </div>
      <div className={`operating-brief ${stage >= 1 ? 'is-visible' : ''}`}>
        <div className="brief-head">
          <div><span>Current operating picture</span><strong>Monday leadership review</strong></div>
          <b>3 need attention</b>
        </div>
        <div className="brief-metrics">
          <div><small>Active work</small><strong>12</strong></div>
          <div><small>On track</small><strong>8</strong></div>
          <div><small>At risk</small><strong>3</strong></div>
        </div>
        <div className="priority-list">
          {priorities.map(([name, detail, risk], index) => (
            <div
              key={name}
              className={`${stage >= 2 ? 'is-visible' : ''} ${stage >= 3 && index === 0 ? 'is-priority' : ''}`}
            >
              <i className={`risk-${risk}`} /><span><strong>{name}</strong><small>{detail}</small></span>
              <b>{index + 1}</b>
            </div>
          ))}
        </div>
        <div className={`brief-action ${stage >= 4 ? 'is-visible' : ''}`}>
          Human review: resolve security owner before client update
        </div>
      </div>
    </div>
  );
};

const ProposalScene: React.FC<{ stage: number }> = ({ stage }) => {
  const matches = [
    ['Harbor Arts Pavilion', '92% match'],
    ['Civic Learning Campus', '84% match'],
    ['Riverfront Commons', '79% match'],
  ];

  return (
    <div className="proposal-scene">
      <div className="rfp-document">
        <div className="document-head"><span>RFP</span><small>Waterfront Arts Center</small></div>
        <p className={stage >= 1 ? 'is-marked' : ''}>Create a civic destination combining adaptive reuse, public realm, and community learning.</p>
        <div className="document-lines"><i /><i /><i /><i /></div>
        <div className={`extracted-tags ${stage >= 1 ? 'is-visible' : ''}`}>
          <span>21 days</span><span>Adaptive reuse</span><span>Civic</span>
        </div>
      </div>
      <div className={`proposal-arrow ${stage >= 2 ? 'is-visible' : ''}`}>→</div>
      <div className={`precedent-stack ${stage >= 2 ? 'is-visible' : ''}`}>
        <span>Relevant experience</span>
        {matches.map(([name, match], index) => (
          <div key={name} style={{ '--row-delay': `${index * 80}ms` } as React.CSSProperties}>
            <i>{index + 1}</i><strong>{name}</strong><small>{match}</small>
          </div>
        ))}
      </div>
      <div className={`pursuit-package ${stage >= 3 ? 'is-visible' : ''}`}>
        <span>Pursuit package</span>
        <strong>Requirements + precedent + verified proof</strong>
        <small className={stage >= 4 ? 'is-visible' : ''}>Ready for human go / no-go review</small>
      </div>
    </div>
  );
};

export default WorkflowSimulation;
