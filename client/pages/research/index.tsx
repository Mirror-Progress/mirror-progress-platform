import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticProps, NextPage } from 'next';
import type { CSSProperties } from 'react';
import PublicSiteHeader from '../../components/PublicSiteHeader';
import ResearchCard from '../../components/research/ResearchCard';
import {
  type ResearchEntry,
  getAllResearchEntries,
  getFeaturedResearchEntry,
  researchWebThemeVars,
} from '../../lib/research';

interface ResearchIndexPageProps {
  featured: ResearchEntry | null;
  entries: ResearchEntry[];
}

const ResearchIndexPage: NextPage<ResearchIndexPageProps> = ({
  featured,
  entries,
}) => {
  const otherEntries = featured
    ? entries.filter((entry) => entry.slug !== featured.slug)
    : entries;

  return (
    <>
      <Head>
        <title>Research | Mirror Progress</title>
        <meta
          name="description"
          content="Public research briefs, whitepapers, and technical notes from Mirror Progress."
        />
      </Head>

      <div
        className="theme-page min-h-screen pb-[96px]"
        style={researchWebThemeVars as CSSProperties}
      >
        <PublicSiteHeader active="research" />

        <main className="basic-pd pt-[42px]">
          <div className="mx-auto flex max-w-6xl flex-col gap-[36px]">
            <section className="research-frame-strong rounded-[40px] px-[30px] py-[32px] md:px-[38px] md:py-[40px]">
              <div className="grid gap-[28px] md:grid-cols-[1.15fr_0.85fr] md:items-end">
                <div className="flex flex-col gap-[18px]">
                  <p className="font-diatype text-[12px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                    Mirror Progress Research
                  </p>
                  <h1 className="max-w-[12ch] font-dmSans text-[64px] font-light leading-[0.94] tracking-m3p text-[color:var(--research-text)] max-md:text-[42px]">
                    Structured public research for technical decision-makers.
                  </h1>
                  <p className="max-w-[60ch] font-dmSans text-[21px] leading-130 text-[color:var(--research-text-muted)] max-md:text-[18px]">
                    Mirror Progress Research publishes concise whitepapers,
                    technical briefs, and strategic notes for organizations
                    building what comes next.
                  </p>
                </div>

                <div className="research-cta-panel rounded-[32px] px-[24px] py-[24px]">
                  <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--theme-research-cta-muted)]">
                    Publishing focus
                  </p>
                  <div className="mt-[18px] flex flex-col gap-[12px]">
                    <p className="font-dmSans text-[22px] font-light leading-110 text-[color:var(--theme-research-cta-text)]">
                      Public insight aligned to the four Mirror Progress capability buckets.
                    </p>
                    <div className="flex flex-wrap gap-[10px]">
                      {[
                        'AI Systems',
                        'Data Platforms',
                        'Web Infrastructure',
                        'Technical Strategy',
                      ].map((label) => (
                        <span
                          key={label}
                          className="theme-chip rounded-full px-[10px] py-[6px] font-diatype text-[11px] uppercase tracking-m3p"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/?skipIntro=contact#contact"
                      className="theme-primary-button mt-[10px] inline-flex w-fit rounded-[999px] px-[18px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p"
                    >
                      Discuss a research-led engagement
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {featured ? (
              <section className="flex flex-col gap-[16px]">
                <div className="flex items-center justify-between gap-[12px]">
                  <h2 className="font-dmSans text-[34px] font-light leading-100 tracking-m3p text-[color:var(--research-text)] max-md:text-[28px]">
                    Featured research
                  </h2>
                  <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                    flagship paper
                  </p>
                </div>
                <ResearchCard entry={featured} featured />
              </section>
            ) : null}

            <section className="flex flex-col gap-[16px]">
              <div className="flex items-center justify-between gap-[12px]">
                <h2 className="font-dmSans text-[34px] font-light leading-100 tracking-m3p text-[color:var(--research-text)] max-md:text-[28px]">
                  Research library
                </h2>
                <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                  public by default
                </p>
              </div>
              <div className="grid gap-[16px] md:grid-cols-2">
                {otherEntries.map((entry) => (
                  <ResearchCard key={entry.slug} entry={entry} />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps<ResearchIndexPageProps> = async () => {
  const entries = getAllResearchEntries();

  return {
    props: {
      featured: getFeaturedResearchEntry(),
      entries,
    },
  };
};

export default ResearchIndexPage;
