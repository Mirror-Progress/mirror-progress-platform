import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrandMark from '../BrandMark';
import ThemeToggle from '../ThemeToggle';
import WorkflowSimulation from './WorkflowSimulation';
import type { CapabilityArtifact, CapabilityExperience, CapabilityStep } from '../../lib/capability-experiences';

type CapabilityExperiencePageProps = {
  experience: CapabilityExperience;
};

const toneClass = (tone: CapabilityArtifact['tone'] = 'neutral') => {
  switch (tone) {
    case 'accent':
      return 'capability-tone-accent';
    case 'success':
      return 'capability-tone-success';
    case 'warning':
      return 'capability-tone-warning';
    default:
      return 'capability-tone-neutral';
  }
};

const modeLabel = {
  proposal: 'Pursuit system demo',
  operations: 'Operations system demo',
  infrastructure: 'Infrastructure readiness demo',
  audit: 'AI readiness audit demo',
} as const;

const modeStatusCopy = {
  proposal: 'Mock pursuit workflow. No real RFP, portfolio, or proposal data is connected.',
  operations: 'Mock operations workflow. No external tools are queried or updated.',
  infrastructure: 'Mock infrastructure readiness workflow. No real client systems, files, or data sources are connected.',
  audit: 'Mock AI readiness audit workflow. No client systems are queried and no recommendations are executed.',
} as const;

const modeArtifactLabel = {
  proposal: 'Pursuit artifact',
  operations: 'Agent workspace',
  infrastructure: 'Infrastructure artifact',
  audit: 'Audit artifact',
} as const;

const modeStateLabel = {
  proposal: 'Pursuit recommendation state',
  operations: 'Operations intelligence state',
  infrastructure: 'Infrastructure readiness state',
  audit: 'Audit roadmap state',
} as const;

const defaultImplementationSteps: Array<[string, string, string]> = [
  ['01', 'Map the workflow', 'Define the real decisions, data sources, users, and risk boundaries before designing the interface.'],
  ['02', 'Build the intelligence layer', 'Connect approved mock or production data into structured retrieval, scoring, drafting, and review flows.'],
  ['03', 'Operate and improve', 'Ship a focused internal system, observe usage, tune the logic, and expand only where value is proven.'],
];

const CapabilityExperiencePage: React.FC<CapabilityExperiencePageProps> = ({ experience }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const activeStep = experience.steps[activeIndex];
  const nextStep = experience.steps[(activeIndex + 1) % experience.steps.length];
  const progress = ((activeIndex + 1) / experience.steps.length) * 100;
  const implementationSteps = experience.implementationSteps ?? defaultImplementationSteps;

  useEffect(() => {
    if (!autoPlay) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % experience.steps.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [autoPlay, experience.steps.length]);

  const statusCopy = useMemo(() => modeStatusCopy[experience.mode], [experience.mode]);

  const handleStepClick = (index: number) => {
    setActiveIndex(index);
    setAutoPlay(false);
  };

  return (
    <>
      <Head>
        <title>{`${experience.title} | Mirror Progress`}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={experience.purpose} />
      </Head>

      <section className={`capability-page capability-page-${experience.mode} min-h-screen overflow-hidden px-[24px] pb-[72px] pt-[24px] text-[var(--theme-text-primary)] max-md:px-[16px]`}>
        <div className="capability-shell mx-auto flex w-full max-w-[1320px] flex-col gap-[38px] max-md:gap-[28px]">
          <header className="capability-private-header theme-panel flex items-center justify-between gap-[16px] rounded-[28px] px-[18px] py-[14px] max-md:rounded-[22px]">
            <Link href="/" aria-label="Mirror Progress home" className="inline-flex items-center gap-[12px]">
              <BrandMark className="h-[28px] w-[30px]" />
              <span className="font-diatype text-[12px] uppercase tracking-m3p text-[var(--theme-text-primary)]">
                Mirror Progress
              </span>
            </Link>

            <div className="hidden items-center gap-[8px] rounded-full border border-[var(--theme-border)] px-[12px] py-[7px] font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)] md:flex">
              <span className="h-[6px] w-[6px] rounded-full bg-[var(--theme-accent)] shadow-[0_0_18px_var(--theme-accent-soft)]" />
              Direct capability brief
            </div>

            <div className="flex items-center gap-[10px]">
              <ThemeToggle className="max-sm:hidden" />
              <a href="#capability-contact" className="theme-secondary-button rounded-full px-[16px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p">
                Discuss
              </a>
            </div>
          </header>

          <div className="capability-hero-grid grid grid-cols-[minmax(0,1fr)_420px] gap-[22px] max-lg:grid-cols-1">
            <section className="theme-panel-strong capability-hero-panel relative overflow-hidden rounded-[32px] p-[34px] max-md:rounded-[24px] max-md:p-[22px]">
              <div className="capability-scanline" aria-hidden="true" />
              <div className="relative z-[1] flex max-w-[820px] flex-col gap-[26px]">
                <div className="flex flex-wrap items-center gap-[10px]">
                  <span className="theme-chip">{experience.eyebrow}</span>
                  <span className="theme-chip">{modeLabel[experience.mode]}</span>
                </div>
                <div className="space-y-[18px]">
                  <h1 className="font-diatype text-[58px] font-semibold leading-[0.96] text-[var(--theme-text-primary)] max-lg:text-[48px] max-md:text-[36px]">
                    {experience.title}
                  </h1>
                  <p className="max-w-[760px] font-diatype text-[18px] leading-[1.6] text-[var(--theme-text-secondary)] max-md:text-[15px]">
                    {experience.purpose}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-[10px] max-md:grid-cols-1">
                  {experience.heroStats.map((stat) => (
                    <div key={`${stat.label}-${stat.value}`} className={`capability-stat ${toneClass(stat.tone)} rounded-[18px] border px-[16px] py-[14px]`}>
                      <p className="font-diatype text-[11px] uppercase tracking-m3p opacity-70">{stat.label}</p>
                      <p className="mt-[8px] font-diatype text-[22px] font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-[12px]">
                  <a href="#capability-demo" className="theme-primary-button rounded-full px-[20px] py-[13px] font-diatype text-[12px] uppercase tracking-m3p">
                    View Interactive Demo
                  </a>
                  <a href="#capability-outcomes" className="theme-secondary-button rounded-full px-[20px] py-[13px] font-diatype text-[12px] uppercase tracking-m3p">
                    Business Outcomes
                  </a>
                </div>
              </div>
            </section>

            <aside className="theme-panel capability-context-panel min-w-0 rounded-[32px] p-[24px] max-md:rounded-[24px]">
              <div className="flex h-full flex-col justify-between gap-[24px]">
                <div className="min-w-0 space-y-[14px]">
                  <span className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
                    {experience.sampleContextTitle}
                  </span>
                  <p className="break-words font-diatype text-[20px] leading-[1.35] text-[var(--theme-text-primary)]">
                    {experience.sampleContextBody}
                  </p>
                </div>
                <div className="space-y-[10px]">
                  {experience.systemLayers.map((layer, index) => (
                    <div key={layer} className="capability-layer-row flex min-w-0 items-center gap-[10px] rounded-[16px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-[13px] py-[11px]">
                      <span className="inline-flex h-[24px] w-[24px] items-center justify-center rounded-full border border-[var(--theme-border)] font-diatype text-[10px] text-[var(--theme-text-muted)]">
                        {index + 1}
                      </span>
                      <span className="min-w-0 break-words font-diatype text-[13px] leading-[1.35] text-[var(--theme-text-secondary)]">{layer}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <WorkflowSimulation mode={experience.mode} />

          <ProgressiveSection id="capability-demo" className="capability-section-frame capability-workflow-module rounded-[32px] p-[18px] max-md:rounded-[24px] max-md:p-[12px]">
            <div className="mb-[16px] flex flex-wrap items-center justify-between gap-[12px] px-[8px]">
              <div className="min-w-0 max-w-[780px]">
                <span className="theme-chip">Interactive Workflow Steps</span>
                <h2 className="mt-[12px] break-words font-diatype text-[28px] font-semibold leading-[1.12] text-[var(--theme-text-primary)] max-md:text-[22px]">
                  Explore the workflow one decision at a time.
                </h2>
                <p className="mt-[8px] max-w-[720px] break-words font-diatype text-[14px] leading-[1.6] text-[var(--theme-text-secondary)]">{statusCopy}</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoPlay((current) => !current)}
                className="capability-control-button rounded-full border border-[var(--theme-border)] px-[14px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-secondary)] transition hover:border-[var(--theme-border-strong)] hover:text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-soft)]"
              >
                {autoPlay ? 'Pause Flow' : 'Auto Flow'}
              </button>
            </div>

            <div className="capability-demo-grid grid grid-cols-[300px_minmax(0,1fr)_310px] gap-[14px] max-xl:grid-cols-[280px_minmax(0,1fr)] max-lg:grid-cols-1">
              <WorkflowRail steps={experience.steps} activeIndex={activeIndex} onStepClick={handleStepClick} />
              <DemoConsole activeStep={activeStep} activeIndex={activeIndex} progress={progress} totalSteps={experience.steps.length} mode={experience.mode} />
              <LiveOutcomePanel activeStep={activeStep} nextStep={nextStep} mode={experience.mode} />
            </div>
          </ProgressiveSection>

          <ProgressiveSection id="capability-outcomes" className="capability-section-frame rounded-[32px] p-[14px] max-md:rounded-[24px]">
            <div className="mb-[14px] flex flex-wrap items-end justify-between gap-[12px] px-[8px]">
              <div>
                <span className="theme-chip">Business Value</span>
                <h2 className="mt-[12px] break-words font-diatype text-[28px] font-semibold leading-[1.12] text-[var(--theme-text-primary)] max-md:text-[22px]">
                  What the system changes for the team.
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-[0.8fr_1.2fr] gap-[20px] max-lg:grid-cols-1">
              <div className="capability-value-intro min-w-0 rounded-[28px] p-[28px] max-md:rounded-[22px] max-md:p-[20px]">
                <span className="theme-chip">Capability fit</span>
                <h2 className="mt-[18px] break-words font-diatype text-[32px] font-semibold leading-[1.08] text-[var(--theme-text-primary)] max-md:text-[26px]">
                  Built for teams that need intelligence, not another static page.
                </h2>
                <p className="mt-[16px] break-words font-diatype text-[15px] leading-[1.65] text-[var(--theme-text-secondary)]">
                  {experience.audience}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
                {experience.outcomes.map((outcome) => (
                  <article key={outcome.title} className="capability-value-card min-w-0 rounded-[24px] p-[20px]">
                    {outcome.metric ? (
                      <span className="capability-mini-metric inline-flex max-w-full rounded-full border border-[var(--theme-border)] px-[10px] py-[6px] font-diatype text-[10px] uppercase leading-[1.2] tracking-m3p">
                        {outcome.metric}
                      </span>
                    ) : null}
                    <h3 className="mt-[18px] break-words font-diatype text-[18px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{outcome.title}</h3>
                    <p className="mt-[10px] break-words font-diatype text-[13px] leading-[1.55] text-[var(--theme-text-secondary)]">{outcome.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </ProgressiveSection>

          <TransformationSection mode={experience.mode} />

          <ProgressiveSection className="capability-section-frame rounded-[32px] p-[14px] max-md:rounded-[24px]">
            <div className="grid grid-cols-[0.75fr_1.25fr] gap-[18px] max-lg:grid-cols-1">
              <div className="capability-process-intro min-w-0 rounded-[28px] p-[26px] max-md:rounded-[22px] max-md:p-[20px]">
                <span className="theme-chip">Implementation Approach</span>
                <h2 className="mt-[16px] break-words font-diatype text-[30px] font-semibold leading-[1.12] text-[var(--theme-text-primary)] max-md:text-[24px]">
                  Designed around the real operating context.
                </h2>
                <p className="mt-[13px] break-words font-diatype text-[14px] leading-[1.65] text-[var(--theme-text-secondary)]">
                  Mirror Progress builds these as custom systems: workflow first, data boundaries second, interface third, with human review built into the places where judgment matters.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-[12px] max-md:grid-cols-1">
                {implementationSteps.map(([number, title, body]) => (
                  <article key={title} className="capability-process-card min-w-0 rounded-[24px] p-[20px]">
                    <span className="capability-process-number inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border font-diatype text-[11px]">
                      {number}
                    </span>
                    <h3 className="mt-[16px] break-words font-diatype text-[17px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">{title}</h3>
                    <p className="mt-[9px] break-words font-diatype text-[13px] leading-[1.55] text-[var(--theme-text-secondary)]">{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </ProgressiveSection>

          <ProgressiveSection id="capability-contact" className="theme-panel-strong flex items-center justify-between gap-[20px] rounded-[32px] p-[28px] max-md:flex-col max-md:items-start max-md:rounded-[24px] max-md:p-[20px]">
            <div className="max-w-[760px]">
              <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Custom Mirror Progress system</p>
              <h2 className="mt-[10px] font-diatype text-[30px] font-semibold leading-[1.12] text-[var(--theme-text-primary)] max-md:text-[24px]">
                Shape this into a real operating system for your team.
              </h2>
              <p className="mt-[12px] font-diatype text-[14px] leading-[1.6] text-[var(--theme-text-secondary)]">
                These demos use realistic mock data and human approval gates. The next step is mapping the actual workflows, data sources, risk boundaries, and business outcomes that matter.
              </p>
            </div>
            <Link href="/#contact" className="theme-primary-button shrink-0 rounded-full px-[22px] py-[14px] font-diatype text-[12px] uppercase tracking-m3p focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-soft)] max-md:w-full max-md:justify-center">
              {experience.ctaLabel}
            </Link>
          </ProgressiveSection>
        </div>
      </section>

      <style jsx global>{`
        .capability-page {
          --theme-bg: var(--theme-page-bg);
          --theme-bg-elevated: var(--theme-page-bg-soft);
          --theme-text-primary: #f8ffff;
          --theme-text-secondary: rgba(246, 251, 251, 0.78);
          --theme-text-muted: rgba(246, 251, 251, 0.62);
          --theme-surface: rgba(7, 32, 34, 0.78);
          --theme-surface-muted: rgba(255, 255, 255, 0.055);
          --theme-accent: #b9efef;
          --theme-accent-soft: rgba(185, 239, 239, 0.14);
          --capability-readable-surface: rgba(8, 35, 37, 0.84);
          --capability-readable-surface-muted: rgba(14, 51, 54, 0.72);
          --capability-readable-border: rgba(255, 255, 255, 0.14);
          --capability-readable-shadow: 0 22px 70px rgba(0, 0, 0, 0.2);
          background:
            radial-gradient(circle at 18% 14%, color-mix(in srgb, var(--theme-accent) 17%, transparent), transparent 28%),
            radial-gradient(circle at 82% 22%, rgba(120, 164, 255, 0.11), transparent 30%),
            linear-gradient(180deg, var(--theme-bg) 0%, var(--theme-bg-elevated) 100%);
        }

        :root[data-theme='light'] .capability-page {
          --theme-bg: #eef4ff;
          --theme-bg-elevated: #f8fbff;
          --theme-text-primary: #10264f;
          --theme-text-secondary: #27466f;
          --theme-text-muted: #526985;
          --theme-surface: rgba(255, 255, 255, 0.92);
          --theme-surface-muted: rgba(228, 238, 255, 0.82);
          --theme-accent: #1d5fc7;
          --theme-accent-soft: rgba(29, 95, 199, 0.14);
          --capability-readable-surface: rgba(255, 255, 255, 0.94);
          --capability-readable-surface-muted: rgba(235, 243, 255, 0.9);
          --capability-readable-border: rgba(84, 130, 201, 0.34);
          --capability-readable-shadow: 0 24px 70px rgba(28, 75, 150, 0.13);
        }

        .capability-page-operations {
          background:
            radial-gradient(circle at 16% 12%, rgba(48, 214, 156, 0.16), transparent 28%),
            radial-gradient(circle at 84% 18%, color-mix(in srgb, var(--theme-accent) 12%, transparent), transparent 30%),
            linear-gradient(180deg, var(--theme-bg) 0%, var(--theme-bg-elevated) 100%);
        }

        .capability-page-infrastructure {
          background:
            radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--theme-accent) 15%, transparent), transparent 30%),
            radial-gradient(circle at 82% 20%, rgba(148, 163, 184, 0.14), transparent 32%),
            linear-gradient(180deg, var(--theme-bg) 0%, var(--theme-bg-elevated) 100%);
        }

        .capability-page-audit {
          background:
            radial-gradient(circle at 20% 14%, rgba(248, 196, 113, 0.14), transparent 28%),
            radial-gradient(circle at 84% 18%, color-mix(in srgb, var(--theme-accent) 12%, transparent), transparent 30%),
            linear-gradient(180deg, var(--theme-bg) 0%, var(--theme-bg-elevated) 100%);
        }

        .capability-hero-panel::after,
        .capability-context-panel::after {
          content: '';
          position: absolute;
          inset: auto 24px 0 24px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--theme-border-strong), transparent);
          opacity: 0.7;
        }

        .capability-scanline {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.08) 28%, transparent 44%),
            linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px);
          background-size: 180% 100%, 100% 42px;
          animation: capabilityScan 8s linear infinite;
          opacity: 0.65;
        }

        .capability-stat,
        .capability-mini-metric {
          color: var(--theme-text-secondary);
          background: var(--theme-surface-muted);
          border-color: var(--theme-border);
        }

        .capability-page .theme-chip {
          max-width: 100%;
          white-space: normal;
          overflow-wrap: anywhere;
          line-height: 1.25;
          color: var(--theme-text-primary);
          background: var(--theme-surface-muted);
          border-color: var(--capability-readable-border);
        }

        .capability-section-frame {
          border: 1px solid var(--capability-readable-border);
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--capability-readable-surface-muted) 92%, transparent) 0%, color-mix(in srgb, var(--capability-readable-surface) 96%, transparent) 100%);
          box-shadow: var(--capability-readable-shadow);
        }

        .capability-progressive-section {
          opacity: 0;
          transform: translateY(18px);
          transition:
            opacity 680ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 680ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .capability-progressive-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .capability-workflow-module {
          position: relative;
          overflow: hidden;
        }

        .capability-workflow-module::before {
          content: '';
          position: absolute;
          inset: 12px;
          border: 1px solid color-mix(in srgb, var(--theme-accent) 18%, var(--capability-readable-border));
          border-radius: 26px;
          pointer-events: none;
          opacity: 0.52;
        }

        .capability-value-intro,
        .capability-process-intro,
        .capability-value-card,
        .capability-process-card {
          border: 1px solid var(--capability-readable-border);
          background: var(--capability-readable-surface);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
          color: var(--theme-text-primary);
        }

        :root[data-theme='light'] .capability-value-intro,
        :root[data-theme='light'] .capability-process-intro,
        :root[data-theme='light'] .capability-value-card,
        :root[data-theme='light'] .capability-process-card {
          box-shadow: 0 18px 48px rgba(28, 75, 150, 0.1);
        }

        .capability-value-card,
        .capability-process-card {
          transition:
            border-color 220ms ease,
            transform 220ms ease,
            box-shadow 220ms ease,
            background 220ms ease;
        }

        .capability-value-card:hover,
        .capability-process-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--theme-accent) 35%, var(--capability-readable-border));
          background: color-mix(in srgb, var(--theme-accent-soft) 20%, var(--capability-readable-surface));
          box-shadow: 0 22px 62px rgba(0, 0, 0, 0.14);
        }

        .capability-process-number {
          color: var(--theme-accent);
          border-color: color-mix(in srgb, var(--theme-accent) 36%, var(--capability-readable-border));
          background: var(--theme-accent-soft);
        }

        .capability-transform-card {
          border: 1px solid var(--capability-readable-border);
          background: var(--capability-readable-surface);
          color: var(--theme-text-primary);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
        }

        .capability-transform-item {
          opacity: 0.64;
          transform: translateY(4px);
          transition:
            opacity 420ms ease,
            transform 420ms ease,
            border-color 420ms ease,
            background 420ms ease;
        }

        .capability-transform-section.is-visible .capability-transform-item {
          opacity: 1;
          transform: translateY(0);
        }

        .capability-transform-before .capability-transform-item {
          border-color: color-mix(in srgb, rgba(251, 191, 36, 0.3) 65%, var(--capability-readable-border));
          background: color-mix(in srgb, rgba(251, 191, 36, 0.06) 45%, var(--capability-readable-surface));
        }

        .capability-transform-after .capability-transform-item {
          border-color: color-mix(in srgb, rgba(74, 222, 128, 0.36) 70%, var(--capability-readable-border));
          background: color-mix(in srgb, rgba(74, 222, 128, 0.09) 55%, var(--capability-readable-surface));
        }

        .capability-transform-bridge {
          position: relative;
          overflow: hidden;
        }

        .capability-transform-bridge::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, var(--theme-accent-soft), transparent);
          animation: capabilityBridgeFlow 4.8s ease-in-out infinite;
        }

        .capability-tone-accent {
          color: var(--theme-text-primary);
          border-color: color-mix(in srgb, var(--theme-accent) 38%, var(--theme-border));
          background: color-mix(in srgb, var(--theme-accent-soft) 36%, var(--theme-surface-muted));
        }

        .capability-tone-success {
          color: var(--theme-text-primary);
          border-color: rgba(74, 222, 128, 0.35);
          background: rgba(74, 222, 128, 0.1);
        }

        .capability-tone-warning {
          color: var(--theme-text-primary);
          border-color: rgba(251, 191, 36, 0.36);
          background: rgba(251, 191, 36, 0.1);
        }

        .capability-step-rail,
        .capability-detail-panel,
        .capability-live-panel {
          border: 1px solid var(--capability-readable-border);
          background: var(--capability-readable-surface);
          color: var(--theme-text-primary);
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.12);
        }

        .capability-step-rail {
          background: var(--capability-readable-surface-muted);
        }

        .capability-step-rail nav,
        .capability-step-rail button,
        .capability-detail-panel,
        .capability-live-panel,
        .capability-value-card,
        .capability-process-card {
          overflow-wrap: anywhere;
        }

        .capability-workflow-step {
          transform: translateZ(0);
          min-width: 0;
          color: var(--theme-text-secondary);
          background: var(--capability-readable-surface);
        }

        .capability-workflow-step.is-active {
          border-color: color-mix(in srgb, var(--theme-accent) 45%, var(--theme-border-strong));
          background: color-mix(in srgb, var(--theme-accent-soft) 32%, var(--capability-readable-surface));
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
          color: var(--theme-text-primary);
        }

        .capability-workflow-step.is-complete {
          border-color: rgba(74, 222, 128, 0.34);
          background: color-mix(in srgb, rgba(74, 222, 128, 0.09) 50%, var(--capability-readable-surface));
        }

        .capability-workflow-step.is-active .capability-step-dot {
          background: var(--theme-accent);
          box-shadow: 0 0 0 8px var(--theme-accent-soft), 0 0 34px var(--theme-accent-soft);
        }

        .capability-console-card {
          animation: capabilityCardIn 420ms ease both;
        }

        .capability-detail-panel,
        .capability-live-panel {
          background: var(--capability-readable-surface);
        }

        :root[data-theme='light'] .capability-workflow-step.is-active,
        :root[data-theme='light'] .capability-detail-panel,
        :root[data-theme='light'] .capability-live-panel,
        :root[data-theme='light'] .capability-value-card,
        :root[data-theme='light'] .capability-process-card {
          box-shadow: 0 18px 48px rgba(28, 75, 150, 0.11);
        }

        .capability-activity-line {
          animation: capabilityCardIn 500ms ease both;
        }

        .capability-control-button:hover,
        .capability-layer-row:hover {
          transform: translateY(-1px);
        }

        .capability-progress-fill {
          width: var(--capability-progress);
          transition: width 420ms ease;
        }

        @keyframes capabilityScan {
          from {
            background-position: 180% 0, 0 0;
          }
          to {
            background-position: -40% 0, 0 42px;
          }
        }

        @keyframes capabilityCardIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes capabilityBridgeFlow {
          0%,
          30% {
            transform: translateX(-100%);
            opacity: 0;
          }
          42%,
          68% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @media (max-width: 767px) {
          .capability-private-header {
            position: sticky;
            top: 10px;
            z-index: 20;
          }

          .capability-demo-grid {
            gap: 12px;
          }

          .capability-section-frame {
            padding: 12px;
          }

          .capability-workflow-module::before {
            inset: 8px;
            border-radius: 22px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .capability-progressive-section,
          .capability-transform-item,
          .capability-transform-bridge::after,
          .capability-scanline,
          .capability-console-card,
          .capability-activity-line {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </>
  );
};

const useInViewOnce = <T extends HTMLElement>(threshold = 0.2) => {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

const ProgressiveSection: React.FC<{
  id?: string;
  className: string;
  children: React.ReactNode;
}> = ({ id, className, children }) => {
  const { ref, isVisible } = useInViewOnce<HTMLElement>(0.18);

  return (
    <section
      ref={ref}
      id={id}
      className={`capability-progressive-section ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </section>
  );
};

const TransformationSection: React.FC<{ mode: CapabilityExperience['mode'] }> = ({ mode }) => {
  const { ref, isVisible } = useInViewOnce<HTMLElement>(0.22);
  const transformationCopy = {
    proposal: {
      heading: 'From scattered pursuits to proposal intelligence.',
      description: 'The system changes pursuit work from reactive searching into a structured intelligence workflow.',
      beforeItems: [
        'Manual opportunity scanning',
        'Portfolio memory spread across files',
        'Slow pursuit qualification',
        'Proposal drafts start from a blank page',
      ],
      afterItems: [
        'Structured opportunity queue',
        'Searchable precedent intelligence',
        'Explainable fit scoring',
        'Draft support from verified material',
      ],
    },
    operations: {
      heading: 'From fragmented operations to coordinated intelligence.',
      description: 'The system changes internal work from disconnected updates into a source-aware operating layer.',
      beforeItems: [
        'Disconnected CRM, tasks, calendar, and docs',
        'Context buried in separate tools',
        'Manual coordination loops',
        'Leadership sees stale status',
      ],
      afterItems: [
        'Connected operational memory',
        'Agent-assisted retrieval and synthesis',
        'Prepared tasks and schedule actions',
        'Live dashboard intelligence',
      ],
    },
    infrastructure: {
      heading: 'From legacy fragments to AI-ready infrastructure.',
      description: 'The system changes modernization from a vague technology goal into a mapped, governed operating foundation.',
      beforeItems: [
        'Data scattered across tools and files',
        'Reports rebuilt manually from exports',
        'No clear AI data foundation',
        'Governance handled after the fact',
      ],
      afterItems: [
        'System and workflow inventory',
        'Normalized source-aware records',
        'Governed AI-ready data layer',
        'Clear audit path to first build',
      ],
    },
    audit: {
      heading: 'From AI uncertainty to a buildable readiness roadmap.',
      description: 'The audit changes AI planning from broad ambition into ranked workflows, blockers, risks, and next-sprint recommendations.',
      beforeItems: [
        'AI goals are broad and hard to sequence',
        'Data gaps are not visible',
        'Governance risks are unclear',
        'First build decision depends on guesswork',
      ],
      afterItems: [
        'Workflows ranked by readiness and value',
        'Data gaps and source trust scored',
        'Risk gates and approvals mapped',
        'First AI-ready sprint recommended',
      ],
    },
  }[mode];

  return (
    <section
      ref={ref}
      className={`capability-transform-section capability-section-frame capability-progressive-section ${isVisible ? 'is-visible' : ''} rounded-[32px] p-[14px] max-md:rounded-[24px]`}
    >
      <div className="mb-[14px] flex flex-wrap items-end justify-between gap-[12px] px-[8px]">
        <div className="min-w-0">
          <span className="theme-chip">Before / After Transformation</span>
          <h2 className="mt-[12px] break-words font-diatype text-[28px] font-semibold leading-[1.12] text-[var(--theme-text-primary)] max-md:text-[22px]">
            {transformationCopy.heading}
          </h2>
          <p className="mt-[8px] max-w-[760px] break-words font-diatype text-[14px] leading-[1.6] text-[var(--theme-text-secondary)]">
            {transformationCopy.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_76px_1fr] gap-[14px] max-lg:grid-cols-1">
        <div className="capability-transform-card capability-transform-before min-w-0 rounded-[28px] p-[22px] max-md:rounded-[22px] max-md:p-[18px]">
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Before</p>
          <h3 className="mt-[10px] break-words font-diatype text-[22px] font-semibold leading-[1.15] text-[var(--theme-text-primary)]">
            Fragmented and manual
          </h3>
          <div className="mt-[16px] space-y-[8px]">
            {transformationCopy.beforeItems.map((item, index) => (
              <div
                key={item}
                className="capability-transform-item rounded-[16px] border px-[12px] py-[10px]"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <p className="break-words font-diatype text-[13px] leading-[1.45] text-[var(--theme-text-secondary)]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center max-lg:py-[2px]">
          <div className="capability-transform-bridge flex h-full min-h-[220px] w-[54px] items-center justify-center rounded-full border border-[var(--capability-readable-border)] bg-[var(--theme-surface-muted)] max-lg:h-[54px] max-lg:min-h-0 max-lg:w-full">
            <span className="relative z-[1] font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-accent)]">
              Into
            </span>
          </div>
        </div>

        <div className="capability-transform-card capability-transform-after min-w-0 rounded-[28px] p-[22px] max-md:rounded-[22px] max-md:p-[18px]">
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">After</p>
          <h3 className="mt-[10px] break-words font-diatype text-[22px] font-semibold leading-[1.15] text-[var(--theme-text-primary)]">
            Connected and explainable
          </h3>
          <div className="mt-[16px] space-y-[8px]">
            {transformationCopy.afterItems.map((item, index) => (
              <div
                key={item}
                className="capability-transform-item rounded-[16px] border px-[12px] py-[10px]"
                style={{ transitionDelay: `${240 + index * 90}ms` }}
              >
                <p className="break-words font-diatype text-[13px] leading-[1.45] text-[var(--theme-text-secondary)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const WorkflowRail: React.FC<{
  steps: CapabilityStep[];
  activeIndex: number;
  onStepClick: (index: number) => void;
}> = ({ steps, activeIndex, onStepClick }) => {
  return (
    <nav className="capability-step-rail rounded-[26px] p-[10px]" aria-label="Capability workflow steps">
      <div className="flex flex-col gap-[8px] max-lg:grid max-lg:grid-cols-2 max-sm:grid-cols-1">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(index)}
              aria-current={isActive ? 'step' : undefined}
              className={`capability-workflow-step rounded-[20px] border px-[14px] py-[13px] text-left transition ${
                isActive ? 'is-active' : 'border-[var(--theme-border)] bg-[var(--theme-surface)] hover:border-[var(--theme-border-strong)]'
              } ${isComplete ? 'is-complete' : ''}`}
            >
              <span className="flex items-center gap-[10px]">
                <span className={`capability-step-dot h-[9px] w-[9px] rounded-full transition ${isComplete ? 'bg-[var(--theme-accent)]' : 'bg-[var(--theme-border-strong)]'}`} />
                <span className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </span>
              <span className="mt-[10px] block break-words font-diatype text-[15px] font-semibold leading-[1.2] text-[var(--theme-text-primary)]">
                {step.label}
              </span>
              <span className="mt-[6px] line-clamp-2 block break-words font-diatype text-[12px] leading-[1.45] text-[var(--theme-text-muted)]">
                {step.statusLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const DemoConsole: React.FC<{
  activeStep: CapabilityStep;
  activeIndex: number;
  progress: number;
  totalSteps: number;
  mode: CapabilityExperience['mode'];
}> = ({ activeStep, activeIndex, progress, totalSteps, mode }) => {
  return (
    <article key={activeStep.id} className="capability-console-card capability-detail-panel min-w-0 rounded-[26px] p-[20px]">
      <div className="flex flex-wrap items-start justify-between gap-[14px]">
        <div className="min-w-0 max-w-[720px]">
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
            Step {String(activeIndex + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
          </p>
          <h2 className="mt-[10px] break-words font-diatype text-[30px] font-semibold leading-[1.08] text-[var(--theme-text-primary)] max-md:text-[24px]">
            {activeStep.headline}
          </h2>
          <p className="mt-[12px] break-words font-diatype text-[15px] leading-[1.62] text-[var(--theme-text-secondary)]">
            {activeStep.description}
          </p>
        </div>
        <div className="min-w-[142px] rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[15px] text-right max-md:w-full max-md:text-left">
          <p className="break-words font-diatype text-[32px] font-semibold leading-none text-[var(--theme-text-primary)]">{activeStep.metric}</p>
          <p className="mt-[7px] font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">{activeStep.metricLabel}</p>
        </div>
      </div>

      <div className="mt-[18px] h-[8px] overflow-hidden rounded-full bg-[var(--theme-surface-muted)]">
        <div
          className="capability-progress-fill h-full rounded-full bg-[var(--theme-accent)]"
          style={{ '--capability-progress': `${progress}%` } as React.CSSProperties}
        />
      </div>

      <div className="mt-[20px] grid grid-cols-[1fr_0.8fr] gap-[14px] max-md:grid-cols-1">
        <div className="rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[16px]">
          <div className="mb-[12px] flex items-center justify-between gap-[12px]">
            <span className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
              {modeArtifactLabel[mode]}
            </span>
            <span className="rounded-full border border-[var(--theme-border)] px-[9px] py-[5px] font-diatype text-[10px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
              {activeStep.statusLabel}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-[10px] max-sm:grid-cols-1">
            {activeStep.artifacts.map((artifact) => (
              <div key={`${activeStep.id}-${artifact.label}-${artifact.value}`} className={`min-w-0 rounded-[16px] border px-[12px] py-[12px] ${toneClass(artifact.tone)}`}>
                <p className="font-diatype text-[10px] uppercase tracking-m3p opacity-70">{artifact.label}</p>
                <p className="mt-[8px] break-words font-diatype text-[13px] font-semibold leading-[1.28]">{artifact.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[16px]">
          <span className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Quality gates</span>
          <div className="mt-[12px] space-y-[8px]">
            {activeStep.checklist.map((item) => (
              <div key={`${activeStep.id}-${item}`} className="flex items-center gap-[9px] rounded-[14px] border border-[var(--theme-border)] bg-[var(--theme-surface)] px-[11px] py-[9px]">
                <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--theme-accent-soft)] text-[10px] text-[var(--theme-accent)]">OK</span>
                <span className="font-diatype text-[12px] text-[var(--theme-text-secondary)]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-[14px] rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] p-[16px]">
        <span className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">System trace</span>
        <div className="mt-[12px] space-y-[8px]">
          {activeStep.activity.map((line, index) => (
            <p
              key={`${activeStep.id}-${line}`}
              className="capability-activity-line flex gap-[10px] font-diatype text-[13px] leading-[1.5] text-[var(--theme-text-secondary)]"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="mt-[8px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--theme-accent)]" />
              {line}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
};

const LiveOutcomePanel: React.FC<{
  activeStep: CapabilityStep;
  nextStep: CapabilityStep;
  mode: CapabilityExperience['mode'];
}> = ({ activeStep, nextStep, mode }) => {
  return (
    <aside className="capability-live-panel min-w-0 rounded-[26px] p-[18px] max-xl:col-span-2 max-lg:col-span-1">
      <div className="flex h-full flex-col gap-[14px]">
        <div className="rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[16px]">
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">
            {modeStateLabel[mode]}
          </p>
          <p className="mt-[14px] font-diatype text-[24px] font-semibold leading-[1.05] text-[var(--theme-text-primary)]">
            {activeStep.statusLabel}
          </p>
          <p className="mt-[10px] font-diatype text-[13px] leading-[1.55] text-[var(--theme-text-secondary)]">
            Current step output is staged for review and ready to feed the next part of the workflow.
          </p>
        </div>

        <div className="rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[16px]">
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Next movement</p>
          <p className="mt-[12px] font-diatype text-[16px] font-semibold leading-[1.25] text-[var(--theme-text-primary)]">{nextStep.label}</p>
          <p className="mt-[8px] font-diatype text-[13px] leading-[1.5] text-[var(--theme-text-secondary)]">{nextStep.statusLabel}</p>
        </div>

        <div className="grid grid-cols-2 gap-[10px]">
          <div className="rounded-[18px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[14px]">
            <p className="font-diatype text-[20px] font-semibold text-[var(--theme-text-primary)]">0</p>
            <p className="mt-[6px] font-diatype text-[10px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Auto sends</p>
          </div>
          <div className="rounded-[18px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[14px]">
            <p className="font-diatype text-[20px] font-semibold text-[var(--theme-text-primary)]">100%</p>
            <p className="mt-[6px] font-diatype text-[10px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Human gated</p>
          </div>
        </div>

        <div className="mt-auto rounded-[22px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-[16px]">
          <p className="font-diatype text-[11px] uppercase tracking-m3p text-[var(--theme-text-muted)]">Build note</p>
          <p className="mt-[10px] font-diatype text-[13px] leading-[1.55] text-[var(--theme-text-secondary)]">
            This direct-link demo is a mocked capability experience. A production build would connect approved sources, data models, and review rules.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default CapabilityExperiencePage;
