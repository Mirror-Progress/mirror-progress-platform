import Link from 'next/link';
import React from 'react';
import {
  ResearchEntry,
  formatResearchDate,
  getResearchCategoryLabel,
} from '../../lib/research';

interface ResearchCardProps {
  entry: ResearchEntry;
  featured?: boolean;
}

const ResearchCard: React.FC<ResearchCardProps> = ({
  entry,
  featured = false,
}) => {
  return (
    <Link
      href={`/research/${entry.slug}`}
      className={`group block rounded-[32px] transition-transform duration-300 hover:-translate-y-[2px] ${
        featured ? 'research-frame-strong' : 'research-frame'
      }`}
    >
      <div
        className={`flex h-full flex-col ${
          featured
            ? 'gap-[28px] px-[28px] py-[28px] md:grid md:grid-cols-[1.35fr_0.9fr] md:items-end'
            : 'gap-[24px] px-[24px] py-[24px]'
        }`}
      >
        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            <span className="theme-chip rounded-full px-[10px] py-[5px] font-diatype text-[11px] uppercase tracking-m3p">
              {entry.type}
            </span>
            <span className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
              {getResearchCategoryLabel(entry.categoryId)}
            </span>
          </div>

          <div className="flex flex-col gap-[12px]">
            <p className="font-diatype text-[12px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
              {entry.cover.eyebrow}
            </p>
            <h3
              className={`font-dmSans font-light leading-[0.98] tracking-m3p ${
                featured ? 'text-[42px] max-md:text-[32px]' : 'text-[28px]'
              }`}
            >
              {entry.title}
            </h3>
            <p className="max-w-[60ch] font-dmSans text-[18px] leading-130 text-[color:var(--research-text-muted)]">
              {entry.abstract}
            </p>
          </div>
        </div>

        <div
          className={`research-outline-card rounded-[28px] ${
            featured
              ? 'flex min-h-[260px] flex-col justify-between px-[24px] py-[22px]'
              : 'flex min-h-[220px] flex-col justify-between px-[20px] py-[20px]'
          }`}
        >
          <div className="flex items-center justify-between gap-[12px]">
            <p className="font-diatype text-[12px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
              {entry.cover.kicker}
            </p>
            {entry.featured ? (
              <span className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-accent)]">
                Featured
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-[16px]">
            <div className="flex items-center justify-between gap-[16px]">
              <span className="font-dmSans text-[22px] font-light leading-100">
                {entry.cover.figureLabel}
              </span>
              <span className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[color:var(--research-border)] text-[18px] text-[color:var(--research-accent)] transition group-hover:translate-x-[2px]">
                ↗
              </span>
            </div>
            <div className="h-[1px] w-full research-divider border-t" />
            <div className="flex flex-wrap gap-[12px] font-diatype text-[12px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
              <span>{formatResearchDate(entry.publishDate)}</span>
              <span>{entry.readTime}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResearchCard;
