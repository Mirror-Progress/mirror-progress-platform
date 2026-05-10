import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { useEffect, useState, type CSSProperties } from 'react';
import PublicSiteHeader from '../../components/PublicSiteHeader';
import ResearchCard from '../../components/research/ResearchCard';
import ResearchContentRenderer from '../../components/research/ResearchContentRenderer';
import {
  type ResearchEntry,
  formatResearchDate,
  getAllResearchEntries,
  getRelatedResearchEntries,
  getResearchBySlug,
  getResearchCategoryLabel,
  getResearchPdfHref,
  researchWebThemeVars,
} from '../../lib/research';

interface ResearchDetailPageProps {
  entry: ResearchEntry;
  related: ResearchEntry[];
}

const ResearchDetailPage: NextPage<ResearchDetailPageProps> = ({
  entry,
  related,
}) => {
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (shareState === 'idle') {
      return;
    }

    const timeout = window.setTimeout(() => setShareState('idle'), 2200);
    return () => window.clearTimeout(timeout);
  }, [shareState]);

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const shareUrl = `${window.location.origin}/research/${entry.slug}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: entry.title,
          text: entry.abstract,
          url: shareUrl,
        });
        setShareState('shared');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareState('copied');
        return;
      }

      throw new Error('Clipboard unavailable');
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }

      setShareState('error');
    }
  };

  const shareFeedback =
    shareState === 'shared'
      ? 'Shared'
      : shareState === 'copied'
        ? 'Link copied'
        : shareState === 'error'
          ? 'Share unavailable'
          : 'Use native share when available, otherwise copy the article URL.';

  return (
    <>
      <Head>
        <title>{`${entry.title} | Mirror Progress Research`}</title>
        <meta name="description" content={entry.abstract} />
      </Head>

      <div
        className="theme-page min-h-screen pb-[96px]"
        style={researchWebThemeVars as CSSProperties}
      >
        <PublicSiteHeader active="research" />

        <main className="basic-pd pt-[42px]">
          <div className="mx-auto flex max-w-6xl flex-col gap-[28px]">
            <section className="research-frame-strong rounded-[40px] px-[30px] py-[32px] md:px-[38px] md:py-[40px]">
              <div className="grid gap-[24px] lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                <div className="flex flex-col gap-[16px]">
                  <Link
                    href="/research"
                    className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)] underline-offset-4 hover:underline"
                  >
                    Back to Research
                  </Link>
                  <div className="flex flex-wrap items-center gap-[10px]">
                    <span className="theme-chip rounded-full px-[10px] py-[5px] font-diatype text-[11px] uppercase tracking-m3p">
                      {entry.type}
                    </span>
                    <span className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                      {getResearchCategoryLabel(entry.categoryId)}
                    </span>
                  </div>
                  <h1 className="max-w-[14ch] font-dmSans text-[62px] font-light leading-[0.94] tracking-m3p text-[color:var(--research-text)] max-md:text-[42px]">
                    {entry.title}
                  </h1>
                  <p className="max-w-[62ch] font-dmSans text-[21px] leading-130 text-[color:var(--research-text-muted)] max-md:text-[18px]">
                    {entry.subtitle}
                  </p>
                  <p className="max-w-[58ch] font-dmSans text-[17px] leading-135 text-[color:var(--research-text-muted)] opacity-90 max-md:text-[16px]">
                    {entry.abstract}
                  </p>
                  <div className="flex flex-wrap gap-[16px] font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                    <span>{formatResearchDate(entry.publishDate)}</span>
                    <span>{entry.readTime}</span>
                    <span>{entry.author.name}</span>
                  </div>
                </div>

                <aside className="research-outline-card rounded-[32px] px-[24px] py-[24px]">
                  <div className="flex flex-col gap-[14px]">
                    <div>
                      <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                        Share or download
                      </p>
                      <p className="mt-[10px] font-dmSans text-[22px] font-light leading-110 text-[color:var(--research-text)]">
                        Same research source, shareable on the web and print-ready in either brand theme.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-[10px]">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="theme-secondary-button inline-flex rounded-[999px] px-[16px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p"
                      >
                        Share
                      </button>
                    </div>
                    <p className="font-dmSans text-[14px] leading-130 text-[color:var(--research-text-muted)]">
                      {shareFeedback}
                    </p>
                    <div className="flex flex-wrap gap-[10px]">
                      <a
                        href={getResearchPdfHref(entry.slug, 'dark')}
                        target="_blank"
                        rel="noreferrer"
                        className="theme-primary-button inline-flex rounded-[999px] px-[16px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p"
                      >
                        Open Dark PDF
                      </a>
                      <a
                        href={getResearchPdfHref(entry.slug, 'light')}
                        target="_blank"
                        rel="noreferrer"
                        className="theme-secondary-button inline-flex rounded-[999px] px-[16px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p"
                      >
                        Open Light PDF
                      </a>
                    </div>
                    <p className="font-dmSans text-[15px] leading-130 text-[color:var(--research-text-muted)]">
                      Each document opens in a branded print view so the browser
                      can save it as PDF without a second content source.
                    </p>
                  </div>
                </aside>
              </div>
            </section>

            <div className="grid gap-[20px] lg:grid-cols-[1fr_320px]">
              <article className="research-frame rounded-[40px] px-[30px] py-[32px] md:px-[38px] md:py-[40px]">
                <ResearchContentRenderer sections={entry.sections} />
              </article>

              <aside className="flex flex-col gap-[18px]">
                <div className="research-outline-card rounded-[32px] px-[22px] py-[22px]">
                  <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                    Tags
                  </p>
                  <div className="mt-[14px] flex flex-wrap gap-[10px]">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="theme-chip rounded-full px-[10px] py-[6px] font-diatype text-[11px] uppercase tracking-m3p"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {entry.cta ? (
                  <div className="research-cta-panel rounded-[32px] px-[22px] py-[22px]">
                    <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-accent)]">
                      Mirror Progress
                    </p>
                    <h2 className="mt-[10px] font-dmSans text-[24px] font-light leading-110 text-[color:var(--theme-research-cta-text)]">
                      {entry.cta.title}
                    </h2>
                    <p className="mt-[12px] font-dmSans text-[16px] leading-130 text-[color:var(--theme-research-cta-muted)]">
                      {entry.cta.text}
                    </p>
                    <Link
                      href={entry.cta.href}
                      className="theme-primary-button mt-[18px] inline-flex rounded-[999px] px-[16px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p"
                    >
                      {entry.cta.label}
                    </Link>
                  </div>
                ) : null}
              </aside>
            </div>

            {related.length > 0 ? (
              <section className="flex flex-col gap-[16px]">
                <div className="flex items-center justify-between gap-[12px]">
                  <h2 className="font-dmSans text-[34px] font-light leading-100 tracking-m3p text-[color:var(--research-text)] max-md:text-[28px]">
                    Related research
                  </h2>
                  <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                    continue reading
                  </p>
                </div>
                <div className="grid gap-[16px] md:grid-cols-2">
                  {related.map((relatedEntry) => (
                    <ResearchCard key={relatedEntry.slug} entry={relatedEntry} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getAllResearchEntries().map((entry) => ({
    params: { slug: entry.slug },
  })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<ResearchDetailPageProps> = async (
  context
) => {
  const slug = String(context.params?.slug ?? '');
  const entry = getResearchBySlug(slug);

  if (!entry) {
    return { notFound: true };
  }

  return {
    props: {
      entry,
      related: getRelatedResearchEntries(entry, 2),
    },
  };
};

export default ResearchDetailPage;
