import Link from 'next/link';
import React, { type CSSProperties } from 'react';
import {
  ResearchEntry,
  ResearchPdfTheme,
  formatResearchDate,
  getResearchCategoryLabel,
  getResearchPdfThemeVars,
} from '../../lib/research';
import ResearchContentRenderer from './ResearchContentRenderer';

interface ResearchPdfDocumentProps {
  entry: ResearchEntry;
  theme: ResearchPdfTheme;
}

const ResearchPdfDocument: React.FC<ResearchPdfDocumentProps> = ({
  entry,
  theme,
}) => {
  const vars = getResearchPdfThemeVars(theme);
  const pageBackground =
    theme === 'light'
      ? 'linear-gradient(180deg, #f9fbff 0%, #eaf4ff 100%)'
      : 'linear-gradient(180deg, #062021 0%, #0a2d2f 100%)';

  const pageText = theme === 'light' ? '#18325f' : '#f7fbfb';
  const mutedText =
    theme === 'light' ? 'rgba(24, 50, 95, 0.72)' : 'rgba(247, 251, 251, 0.72)';

  return (
    <div
      className="min-h-screen"
      style={{
        background: pageBackground,
        color: pageText,
      }}
    >
      <div className="basic-pd py-[28px] print:hidden">
        <div
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-[12px] rounded-[24px] border px-[18px] py-[14px]"
          style={{
            borderColor: theme === 'light' ? 'rgba(118, 165, 230, 0.28)' : 'rgba(255, 255, 255, 0.12)',
            background: theme === 'light' ? 'rgba(255, 255, 255, 0.72)' : 'rgba(8, 28, 29, 0.72)',
          }}
        >
          <div className="flex items-center gap-[12px]">
            <Link href={`/research/${entry.slug}`} className="font-dmSans text-[15px] underline">
              Back to article
            </Link>
            <span className="font-diatype text-[11px] uppercase tracking-m3p" style={{ color: mutedText }}>
              {theme} PDF view
            </span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-[999px] border px-[18px] py-[10px] font-diatype text-[11px] uppercase tracking-m3p"
            style={{
              borderColor: theme === 'light' ? 'rgba(118, 165, 230, 0.28)' : 'rgba(255, 255, 255, 0.14)',
            }}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <article
        className="mx-auto flex max-w-5xl flex-col gap-[28px] px-[24px] pb-[56px] pt-[12px] print:max-w-none print:px-[0] print:pb-[0] print:pt-[0]"
        style={vars as CSSProperties}
      >
        <section className="research-frame-strong rounded-[36px] px-[32px] py-[32px] print:rounded-none print:border-0 print:bg-transparent print:px-[0] print:py-[0] print:shadow-none">
          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-wrap items-center gap-[10px]">
              <span className="rounded-full border px-[10px] py-[5px] font-diatype text-[11px] uppercase tracking-m3p">
                {entry.type}
              </span>
              <span className="font-diatype text-[11px] uppercase tracking-m3p" style={{ color: mutedText }}>
                {getResearchCategoryLabel(entry.categoryId)}
              </span>
            </div>
            <p className="font-diatype text-[12px] uppercase tracking-m3p" style={{ color: mutedText }}>
              {entry.cover.eyebrow}
            </p>
            <h1 className="max-w-[14ch] font-dmSans text-[54px] font-light leading-[0.95] tracking-m3p print:text-[40px]">
              {entry.title}
            </h1>
            <p className="max-w-[72ch] font-dmSans text-[20px] leading-130 print:text-[17px]" style={{ color: mutedText }}>
              {entry.subtitle}
            </p>
            <p className="max-w-[72ch] font-dmSans text-[16px] leading-135 print:text-[15px]" style={{ color: mutedText }}>
              {entry.abstract}
            </p>
            <div className="flex flex-wrap gap-[16px] font-diatype text-[11px] uppercase tracking-m3p" style={{ color: mutedText }}>
              <span>{formatResearchDate(entry.publishDate)}</span>
              <span>{entry.readTime}</span>
              <span>{entry.author.name}</span>
            </div>
          </div>
        </section>

        <section className="research-frame rounded-[36px] px-[32px] py-[32px] print:rounded-none print:border-0 print:bg-transparent print:px-[0] print:py-[0] print:shadow-none">
          <ResearchContentRenderer sections={entry.sections} mode="pdf" />
        </section>
      </article>

      <style jsx global>{`
        @page {
          margin: 18mm 16mm;
        }

        @media print {
          html,
          body {
            background: ${theme === 'light' ? '#ffffff' : '#071d20'} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default ResearchPdfDocument;
