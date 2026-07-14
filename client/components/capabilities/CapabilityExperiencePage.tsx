import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import BrandMark from '../BrandMark';
import ThemeToggle from '../ThemeToggle';
import type { CapabilityExperience } from '../../lib/capability-experiences';
import WorkflowSimulation from './WorkflowSimulation';

type CapabilityExperiencePageProps = {
  experience: CapabilityExperience;
};

const CONTACT_HREF = '/?skipIntro=contact#contact';

const CapabilityExperiencePage: React.FC<CapabilityExperiencePageProps> = ({
  experience,
}) => {
  return (
    <>
      <Head>
        <title>{`${experience.title} | Mirror Progress`}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={experience.problemStatement} />
      </Head>

      <section className={`capability-page capability-page-${experience.mode}`}>
        <div className="capability-shell">
          <header className="capability-private-header">
            <Link href="/" aria-label="Mirror Progress home" className="capability-brand">
              <BrandMark className="h-[27px] w-[29px]" />
              <span>Mirror Progress</span>
            </Link>
            <span className="capability-private-label">
              <i /> Direct capability brief
            </span>
            <div className="capability-header-actions">
              <ThemeToggle />
              <a href={CONTACT_HREF} className="theme-secondary-button capability-discuss-button">
                Discuss
              </a>
            </div>
          </header>

          <main className="capability-primary">
            <section className="capability-copy">
              <span className="capability-eyebrow">{experience.eyebrow}</span>
              <h1>{experience.problemQuestion}</h1>
              <p className="capability-problem">{experience.problemStatement}</p>

              <div className="capability-pain-list" aria-label="Common business problems">
                {experience.painPoints.map((point, index) => (
                  <div key={point}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{point}</p>
                  </div>
                ))}
              </div>

              <div className="capability-solution">
                <span>How Mirror Progress helps</span>
                <p>{experience.solutionStatement}</p>
              </div>

              <a href={CONTACT_HREF} className="theme-primary-button capability-primary-cta">
                {experience.ctaLabel}
                <span aria-hidden="true">↗</span>
              </a>
            </section>

            <WorkflowSimulation experience={experience} />
          </main>

          <section className="capability-close" aria-labelledby="capability-receive-title">
            <div className="capability-close-intro">
              <span>What you receive</span>
              <h2 id="capability-receive-title">A practical path from diagnosis to implementation.</h2>
              <p>{experience.businessCost}</p>
            </div>
            <div className="capability-deliverables">
              {experience.deliverables.map((deliverable, index) => (
                <article key={deliverable}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{deliverable}</h3>
                </article>
              ))}
            </div>
            <div className="capability-close-action">
              <p>{experience.audience}</p>
              <a href={CONTACT_HREF} className="theme-secondary-button">
                Start a conversation
              </a>
            </div>
          </section>
        </div>
      </section>

      <style jsx global>{`
        .capability-page {
          --scene-accent: #a9eded;
          --scene-accent-rgb: 169, 237, 237;
          min-height: 100vh;
          background:
            radial-gradient(circle at 74% 22%, rgba(var(--scene-accent-rgb), 0.07), transparent 25%),
            var(--theme-page-bg);
          color: var(--theme-page-text);
          padding: 20px 24px 42px;
        }

        .capability-page-audit { --scene-accent: #9ee8d7; --scene-accent-rgb: 158, 232, 215; }
        .capability-page-infrastructure { --scene-accent: #8fd9f0; --scene-accent-rgb: 143, 217, 240; }
        .capability-page-operations { --scene-accent: #d6dba1; --scene-accent-rgb: 214, 219, 161; }
        .capability-page-proposal { --scene-accent: #d6b8ef; --scene-accent-rgb: 214, 184, 239; }

        .capability-shell { width: min(1380px, 100%); margin: 0 auto; }
        .capability-private-header {
          min-height: 56px; display: grid; grid-template-columns: 1fr auto 1fr;
          align-items: center; gap: 16px; border-bottom: 1px solid var(--theme-border);
          padding: 0 2px 14px;
        }
        .capability-brand { display: inline-flex; align-items: center; gap: 11px; width: max-content; }
        .capability-brand span, .capability-private-label, .capability-eyebrow,
        .capability-scene-kicker, .capability-solution > span, .capability-close-intro > span {
          font-family: diatype, monospace; text-transform: uppercase; letter-spacing: 0;
        }
        .capability-brand span { font-size: 11px; color: var(--theme-page-text); }
        .capability-private-label { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--theme-page-text-muted); }
        .capability-private-label i { width: 6px; height: 6px; border-radius: 50%; background: var(--scene-accent); box-shadow: 0 0 15px rgba(var(--scene-accent-rgb), .7); }
        .capability-header-actions { justify-self: end; display: flex; align-items: center; gap: 9px; }
        .capability-discuss-button { border-radius: 6px; padding: 9px 14px; font: 10px diatype, monospace; text-transform: uppercase; }

        .capability-primary {
          min-height: 720px; display: grid; grid-template-columns: minmax(400px, .82fr) minmax(600px, 1.18fr);
          gap: clamp(30px, 5vw, 78px); align-items: center; padding: clamp(42px, 6vh, 72px) 0 48px;
        }
        .capability-copy { max-width: 600px; }
        .capability-eyebrow { display: block; color: var(--scene-accent); font-size: 10px; margin-bottom: 18px; }
        .capability-copy h1 {
          max-width: 590px; margin: 0; font-family: diatype, sans-serif; font-size: clamp(42px, 4.4vw, 66px);
          line-height: .98; font-weight: 600; letter-spacing: 0; color: var(--theme-page-text-strong);
        }
        .capability-problem { max-width: 575px; margin: 22px 0 0; font: 16px/1.6 'DM Sans', sans-serif; color: var(--theme-page-text-muted); }
        .capability-pain-list { display: grid; gap: 0; margin-top: 24px; border-top: 1px solid var(--theme-border); }
        .capability-pain-list > div { display: grid; grid-template-columns: 34px 1fr; gap: 9px; padding: 9px 0; border-bottom: 1px solid var(--theme-border); }
        .capability-pain-list span { padding-top: 2px; font: 9px diatype, monospace; color: var(--scene-accent); }
        .capability-pain-list p { margin: 0; font: 13px/1.45 'DM Sans', sans-serif; color: var(--theme-page-text-muted); }
        .capability-solution { margin-top: 20px; padding-left: 14px; border-left: 2px solid var(--scene-accent); }
        .capability-solution > span { font-size: 9px; color: var(--scene-accent); }
        .capability-solution p { margin: 7px 0 0; font: 14px/1.5 'DM Sans', sans-serif; color: var(--theme-page-text); }
        .capability-primary-cta { display: inline-flex; align-items: center; gap: 18px; margin-top: 23px; border-radius: 6px; padding: 12px 16px; font: 10px diatype, monospace; text-transform: uppercase; }
        .capability-primary-cta span { font-size: 15px; }

        .capability-scene {
          min-width: 0; border: 1px solid var(--theme-border); background: var(--theme-panel-bg-strong);
          box-shadow: var(--theme-shadow); border-radius: 8px; overflow: hidden;
        }
        .capability-scene-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 66px; padding: 13px 15px; border-bottom: 1px solid var(--theme-border); }
        .capability-scene-kicker { margin: 0; font-size: 9px; color: var(--theme-page-text-muted); }
        .capability-scene-status { margin: 5px 0 0; font: 13px diatype, monospace; color: var(--theme-page-text); }
        .capability-scene-controls { display: flex; gap: 6px; }
        .capability-icon-button { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--theme-border); border-radius: 4px; color: var(--theme-page-text-muted); transition: .18s ease; }
        .capability-icon-button:hover:not(:disabled) { border-color: var(--scene-accent); color: var(--scene-accent); }
        .capability-icon-button:disabled { opacity: .35; }
        .capability-icon-button svg { width: 15px; height: 15px; }
        .capability-scene-canvas { position: relative; height: 455px; overflow: hidden; background: color-mix(in srgb, var(--theme-card-bg-soft) 75%, transparent); }
        .capability-stage-nav { display: grid; grid-template-columns: repeat(5, 1fr); border-top: 1px solid var(--theme-border); }
        .capability-stage-nav button { min-width: 0; padding: 10px 5px; border-right: 1px solid var(--theme-border); font: 9px diatype, monospace; color: var(--theme-page-text-muted); transition: .18s ease; }
        .capability-stage-nav button:last-child { border-right: 0; }
        .capability-stage-nav button span { display: block; margin-bottom: 4px; font-size: 8px; color: color-mix(in srgb, var(--theme-page-text-muted) 65%, transparent); }
        .capability-stage-nav button.is-active { background: rgba(var(--scene-accent-rgb), .1); color: var(--scene-accent); }
        .capability-scene-note { margin: 0; padding: 8px 14px; border-top: 1px solid var(--theme-border); font: 9px diatype, monospace; color: var(--theme-page-text-subtle); }

        .audit-scene, .infrastructure-scene, .operations-scene, .proposal-scene { position: relative; width: 100%; height: 100%; padding: 28px; }
        .audit-pressure { display: flex; justify-content: space-between; gap: 16px; padding: 13px 15px; border: 1px solid var(--theme-border); border-radius: 5px; background: var(--theme-card-bg); }
        .audit-pressure span, .audit-recommendation span { font: 9px diatype, monospace; text-transform: uppercase; color: var(--scene-accent); }
        .audit-pressure strong { font: 12px diatype, monospace; color: var(--theme-page-text); }
        .audit-matrix { margin-top: 22px; }
        .audit-matrix-head, .audit-row { display: grid; grid-template-columns: 1.55fr repeat(3, 1fr); gap: 12px; align-items: center; }
        .audit-matrix-head { padding: 0 12px 8px; font: 8px diatype, monospace; text-transform: uppercase; color: var(--theme-page-text-subtle); }
        .audit-row { opacity: 0; transform: translateY(8px); padding: 13px 12px; border-top: 1px solid var(--theme-border); transition: .45s ease var(--row-delay); }
        .audit-row.is-visible { opacity: 1; transform: none; }
        .audit-row.is-selected { background: rgba(var(--scene-accent-rgb), .1); box-shadow: inset 2px 0 0 var(--scene-accent); }
        .audit-row > strong { font: 11px diatype, monospace; color: var(--theme-page-text); }
        .score-cell { position: relative; height: 5px; background: var(--theme-progress-track); }
        .score-cell span { display: block; height: 100%; background: var(--scene-accent); transition: width .65s ease; }
        .score-cell span.is-risk { background: #d7b18e; }
        .score-cell small { position: absolute; top: -17px; right: 0; font: 8px diatype, monospace; color: var(--theme-page-text-muted); }
        .audit-recommendation { position: absolute; left: 28px; right: 28px; bottom: 25px; opacity: 0; transform: translateY(10px); padding: 15px; border: 1px solid rgba(var(--scene-accent-rgb), .4); background: rgba(var(--scene-accent-rgb), .08); transition: .45s ease; }
        .audit-recommendation.is-visible { opacity: 1; transform: none; }
        .audit-recommendation strong, .audit-recommendation small { display: block; }
        .audit-recommendation strong { margin-top: 7px; font: 13px diatype, monospace; color: var(--theme-page-text); }
        .audit-recommendation small { margin-top: 7px; font: 9px diatype, monospace; color: var(--theme-page-text-muted); }

        .system-map { position: relative; height: 330px; }
        .system-map svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .system-map path { fill: none; stroke: var(--scene-accent); stroke-width: 1.4; stroke-dasharray: 7 7; opacity: 0; transition: opacity .4s ease; }
        .system-map path.is-visible { opacity: .55; animation: capability-flow 1.2s linear infinite; }
        .system-node { position: absolute; width: 142px; opacity: 0; padding: 10px; border: 1px solid var(--theme-border); background: var(--theme-card-bg); transition: .5s ease; z-index: 2; }
        .system-node.is-visible { opacity: 1; }
        .system-node span, .system-node small { display: block; }
        .system-node span { font: 10px diatype, monospace; color: var(--theme-page-text); }
        .system-node small { margin-top: 5px; font: 8px diatype, monospace; color: #d7b18e; }
        .system-node.is-organized small { color: var(--scene-accent); }
        .system-node-1 { left: 0; top: 10px; }.system-node-2 { right: 0; top: 10px; }.system-node-3 { left: 0; bottom: 10px; }.system-node-4 { right: 0; bottom: 10px; }
        .foundation-core { position: absolute; z-index: 3; left: 50%; top: 50%; width: 176px; opacity: 0; transform: translate(-50%, -50%) scale(.92); padding: 18px 12px; border: 1px solid rgba(var(--scene-accent-rgb), .5); background: color-mix(in srgb, var(--theme-page-bg) 88%, transparent); text-align: center; transition: .45s ease; }
        .foundation-core.is-visible { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        .foundation-core span, .foundation-core strong, .foundation-core small { display: block; font-family: diatype, monospace; }
        .foundation-core span { font-size: 8px; text-transform: uppercase; color: var(--scene-accent); }
        .foundation-core strong { margin-top: 7px; font-size: 11px; color: var(--theme-page-text); }
        .foundation-core small { opacity: 0; margin-top: 8px; font-size: 7px; color: var(--theme-page-text-muted); transition: opacity .4s ease; }.foundation-core small.is-visible { opacity: 1; }
        .foundation-output { opacity: 0; transform: translateY(8px); padding: 12px 14px; border-left: 2px solid var(--scene-accent); background: var(--theme-card-bg); transition: .45s ease; }
        .foundation-output.is-visible { opacity: 1; transform: none; }
        .foundation-output span, .foundation-output strong { display: block; font-family: diatype, monospace; }.foundation-output span { font-size: 8px; color: var(--scene-accent); text-transform: uppercase; }.foundation-output strong { margin-top: 6px; font-size: 11px; color: var(--theme-page-text); }

        .operations-scene { display: grid; grid-template-columns: 112px 1fr; gap: 18px; align-items: stretch; }
        .operations-sources { display: flex; flex-direction: column; justify-content: center; gap: 9px; }
        .operations-sources span { opacity: 0; transform: translateX(-8px); padding: 10px 8px; border: 1px solid var(--theme-border); font: 9px diatype, monospace; color: var(--theme-page-text-muted); transition: .4s ease var(--row-delay); }
        .operations-sources span.is-visible { opacity: 1; transform: none; }.operations-sources i { display: inline-block; width: 5px; height: 5px; margin-right: 7px; border-radius: 50%; background: var(--scene-accent); }
        .operating-brief { opacity: 0; transform: translateX(10px); padding: 17px; border: 1px solid var(--theme-border); background: var(--theme-card-bg-soft); transition: .45s ease; }
        .operating-brief.is-visible { opacity: 1; transform: none; }
        .brief-head { display: flex; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--theme-border); }.brief-head span,.brief-head strong { display:block; font-family:diatype,monospace; }.brief-head span { font-size:8px; text-transform:uppercase; color:var(--scene-accent); }.brief-head strong { margin-top:6px; font-size:12px; color:var(--theme-page-text); }.brief-head b { align-self:center; padding:6px 8px; background:rgba(215,177,142,.12); font:8px diatype,monospace; color:#d7b18e; }
        .brief-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:13px 0; }.brief-metrics div { padding:10px; border:1px solid var(--theme-border); }.brief-metrics small,.brief-metrics strong { display:block; font-family:diatype,monospace; }.brief-metrics small { font-size:7px; color:var(--theme-page-text-subtle); }.brief-metrics strong { margin-top:5px; font-size:16px; color:var(--theme-page-text); }
        .priority-list > div { display:grid; grid-template-columns:8px 1fr 18px; gap:9px; align-items:center; opacity:0; padding:10px 8px; border-top:1px solid var(--theme-border); transition:.35s ease; }.priority-list > div.is-visible { opacity:1; }.priority-list > div.is-priority { background:rgba(var(--scene-accent-rgb),.08); }.priority-list i { width:6px;height:6px;border-radius:50%;background:var(--scene-accent); }.priority-list i.risk-high { background:#d7b18e; }.priority-list span strong,.priority-list span small { display:block;font-family:diatype,monospace; }.priority-list span strong { font-size:9px;color:var(--theme-page-text); }.priority-list span small { margin-top:4px;font-size:7px;color:var(--theme-page-text-muted); }.priority-list b { font:9px diatype,monospace;color:var(--theme-page-text-subtle); }
        .brief-action { opacity:0; margin-top:12px; padding:10px; border-left:2px solid var(--scene-accent); background:rgba(var(--scene-accent-rgb),.08); font:8px/1.4 diatype,monospace; color:var(--theme-page-text); transition:.4s ease; }.brief-action.is-visible { opacity:1; }

        .proposal-scene { display:grid; grid-template-columns:1fr 30px 1fr; gap:12px; align-items:center; padding-bottom:100px; }
        .rfp-document { min-height:260px; padding:17px; border:1px solid var(--theme-border); background:var(--theme-card-bg); }.document-head { display:flex; justify-content:space-between; padding-bottom:11px; border-bottom:1px solid var(--theme-border); }.document-head span { padding:4px 6px; background:rgba(var(--scene-accent-rgb),.12); font:8px diatype,monospace;color:var(--scene-accent); }.document-head small { font:8px diatype,monospace;color:var(--theme-page-text-muted); }.rfp-document p { margin:18px 0 0; font:10px/1.6 diatype,monospace;color:var(--theme-page-text-muted);transition:.4s ease; }.rfp-document p.is-marked { color:var(--theme-page-text);background:linear-gradient(transparent 55%,rgba(var(--scene-accent-rgb),.18) 55%); }.document-lines { display:grid;gap:7px;margin-top:16px; }.document-lines i { height:4px;background:var(--theme-progress-track); }.document-lines i:nth-child(2){width:82%}.document-lines i:nth-child(3){width:91%}.document-lines i:nth-child(4){width:65%}.extracted-tags { display:flex;flex-wrap:wrap;gap:5px;opacity:0;margin-top:17px;transition:.4s ease; }.extracted-tags.is-visible { opacity:1; }.extracted-tags span { padding:5px 6px;border:1px solid rgba(var(--scene-accent-rgb),.3);font:7px diatype,monospace;color:var(--scene-accent); }
        .proposal-arrow { opacity:0;text-align:center;font:20px diatype,monospace;color:var(--scene-accent);transition:.4s ease; }.proposal-arrow.is-visible { opacity:1; }
        .precedent-stack { opacity:0;transform:translateX(8px);transition:.45s ease; }.precedent-stack.is-visible { opacity:1;transform:none; }.precedent-stack > span { display:block;margin-bottom:9px;font:8px diatype,monospace;text-transform:uppercase;color:var(--scene-accent); }.precedent-stack > div { display:grid;grid-template-columns:25px 1fr;gap:3px 8px;align-items:center;padding:10px;border:1px solid var(--theme-border);margin-top:7px;background:var(--theme-card-bg); }.precedent-stack i { grid-row:span 2;display:grid;place-items:center;width:23px;height:23px;border:1px solid var(--theme-border);font:8px diatype,monospace;color:var(--theme-page-text-muted); }.precedent-stack strong { font:9px diatype,monospace;color:var(--theme-page-text); }.precedent-stack small { font:7px diatype,monospace;color:var(--scene-accent); }
        .pursuit-package { position:absolute;left:28px;right:28px;bottom:25px;opacity:0;transform:translateY(8px);padding:13px 15px;border:1px solid rgba(var(--scene-accent-rgb),.35);background:rgba(var(--scene-accent-rgb),.08);transition:.45s ease; }.pursuit-package.is-visible { opacity:1;transform:none; }.pursuit-package span,.pursuit-package strong,.pursuit-package small { display:block;font-family:diatype,monospace; }.pursuit-package span { font-size:8px;text-transform:uppercase;color:var(--scene-accent); }.pursuit-package strong { margin-top:6px;font-size:11px;color:var(--theme-page-text); }.pursuit-package small { opacity:0;margin-top:6px;font-size:8px;color:var(--theme-page-text-muted);transition:.4s ease; }.pursuit-package small.is-visible { opacity:1; }

        .capability-close { display:grid; grid-template-columns:1.1fr 1.55fr .75fr; gap:28px; align-items:center; min-height:205px; padding:31px 0 9px; border-top:1px solid var(--theme-border); }
        .capability-close-intro > span { font-size:9px;color:var(--scene-accent); }.capability-close-intro h2 { max-width:390px;margin:9px 0 0;font:500 22px/1.15 diatype,sans-serif;color:var(--theme-page-text); }.capability-close-intro p { max-width:410px;margin:11px 0 0;font:11px/1.5 'DM Sans',sans-serif;color:var(--theme-page-text-muted); }
        .capability-deliverables { display:grid;grid-template-columns:repeat(3,1fr);border-left:1px solid var(--theme-border); }.capability-deliverables article { min-height:105px;padding:10px 16px;border-right:1px solid var(--theme-border); }.capability-deliverables span { font:8px diatype,monospace;color:var(--scene-accent); }.capability-deliverables h3 { margin:25px 0 0;font:500 12px/1.35 diatype,sans-serif;color:var(--theme-page-text); }
        .capability-close-action p { margin:0 0 13px;font:10px/1.45 'DM Sans',sans-serif;color:var(--theme-page-text-muted); }.capability-close-action a { display:inline-flex;border-radius:5px;padding:10px 13px;font:9px diatype,monospace;text-transform:uppercase; }

        @keyframes capability-flow { to { stroke-dashoffset:-28; } }

        @media (max-width: 1120px) {
          .capability-primary { grid-template-columns: minmax(360px,.8fr) minmax(520px,1.2fr); gap:28px; }
          .capability-close { grid-template-columns:1fr 1.5fr; }.capability-close-action { grid-column:1/-1; display:flex;justify-content:space-between;align-items:center; }.capability-close-action p { max-width:650px; }
        }
        @media (max-width: 900px) {
          .capability-page { padding:16px 16px 34px; }.capability-primary { display:flex;flex-direction:column;min-height:0;padding:44px 0 38px;align-items:stretch; }.capability-copy { max-width:720px; }.capability-scene-canvas { height:430px; }.capability-close { grid-template-columns:1fr; }.capability-deliverables { border-left:0;border-top:1px solid var(--theme-border); }.capability-close-action { grid-column:auto; }
        }
        @media (max-width: 600px) {
          .capability-private-header { grid-template-columns:1fr auto; }.capability-private-label { display:none; }.capability-header-actions :global(.theme-toggle) { display:none; }
          .capability-copy h1 { font-size:39px; }.capability-problem { font-size:15px; }.capability-primary-cta { width:100%;justify-content:space-between; }
          .capability-scene-head { min-height:62px; }.capability-scene-canvas { height:470px; }.capability-stage-nav button { padding:9px 2px;font-size:7px; }.capability-stage-nav button span { font-size:7px; }
          .audit-scene,.infrastructure-scene,.operations-scene,.proposal-scene { padding:18px; }.audit-pressure { display:block; }.audit-pressure strong { display:block;margin-top:7px; }.audit-matrix-head,.audit-row { grid-template-columns:1.3fr repeat(3,.75fr);gap:7px; }.audit-matrix-head { font-size:6px; }.audit-row > strong { font-size:8px; }.audit-recommendation { left:18px;right:18px;bottom:18px; }
          .system-node { width:108px; }.system-node span { font-size:8px; }.system-node small { font-size:6px; }.foundation-core { width:138px; }.foundation-output strong { font-size:9px; }
          .operations-scene { grid-template-columns:1fr;grid-template-rows:auto 1fr;gap:10px; }.operations-sources { flex-direction:row;justify-content:flex-start;overflow:hidden; }.operations-sources span { padding:8px 6px;font-size:7px;white-space:nowrap; }.operations-sources i { display:none; }.operating-brief { padding:12px; }.brief-metrics div { padding:8px; }
          .proposal-scene { grid-template-columns:1fr 18px 1fr;padding:18px 18px 104px;gap:6px; }.rfp-document { min-height:250px;padding:10px; }.document-head { display:block; }.document-head small { display:block;margin-top:7px; }.rfp-document p { font-size:7px; }.precedent-stack > div { grid-template-columns:1fr;padding:7px; }.precedent-stack i { display:none; }.precedent-stack strong { font-size:7px; }.pursuit-package { left:18px;right:18px;bottom:18px; }
          .capability-close { padding-top:26px; }.capability-deliverables { grid-template-columns:1fr; }.capability-deliverables article { display:grid;grid-template-columns:34px 1fr;align-items:center;min-height:58px;padding:8px 0;border-right:0;border-bottom:1px solid var(--theme-border); }.capability-deliverables h3 { margin:0; }.capability-close-action { display:block; }.capability-close-action a { width:100%;justify-content:center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .capability-page *, .capability-page *::before, .capability-page *::after { animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important; }
        }
      `}</style>
    </>
  );
};

export default CapabilityExperiencePage;
