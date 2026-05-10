import React from 'react';
import { ResearchSection } from '../../lib/research';

interface ResearchContentRendererProps {
  sections: ResearchSection[];
  mode?: 'web' | 'pdf';
}

const ResearchContentRenderer: React.FC<ResearchContentRendererProps> = ({
  sections,
  mode = 'web',
}) => {
  const headingClass =
    mode === 'pdf'
      ? 'font-dmSans text-[28px] font-light leading-100 tracking-m3p'
      : 'font-dmSans text-[32px] font-light leading-100 tracking-m3p max-md:text-[26px]';

  return (
    <div className="flex flex-col gap-[28px]">
      {sections.map((section) => {
        switch (section.type) {
          case 'lead':
            return (
              <p
                key={section.id}
                className={`font-dmSans leading-130 text-[color:var(--research-text)] ${
                  mode === 'pdf'
                    ? 'text-[22px] font-light'
                    : 'text-[24px] font-light max-md:text-[20px]'
                }`}
              >
                {section.text}
              </p>
            );

          case 'paragraph':
            return (
              <p
                key={section.id}
                className={`max-w-[68ch] font-dmSans leading-140 text-[color:var(--research-text-muted)] ${
                  mode === 'pdf' ? 'text-[15px]' : 'text-[18px] max-md:text-[16px]'
                }`}
              >
                {section.text}
              </p>
            );

          case 'heading': {
            const HeadingTag = section.level === 3 ? 'h3' : 'h2';
            return (
              <HeadingTag key={section.id} className={headingClass}>
                {section.text}
              </HeadingTag>
            );
          }

          case 'bullets':
            return (
              <div key={section.id} className="research-outline-card rounded-[28px] px-[22px] py-[22px]">
                {section.title ? (
                  <h3 className="mb-[14px] font-dmSans text-[24px] font-light leading-110">
                    {section.title}
                  </h3>
                ) : null}
                <ul className="flex list-disc flex-col gap-[12px] pl-[18px] text-[color:var(--research-text-muted)]">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className={`font-dmSans leading-135 ${
                        mode === 'pdf' ? 'text-[15px]' : 'text-[17px]'
                      }`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );

          case 'steps':
            return (
              <section key={section.id} className="flex flex-col gap-[16px]">
                <h3 className="font-dmSans text-[26px] font-light leading-110">
                  {section.title}
                </h3>
                <ol className="flex flex-col gap-[12px]">
                  {section.items.map((item, index) => (
                    <li
                      key={item.title}
                      className="research-outline-card grid gap-[14px] rounded-[24px] px-[18px] py-[18px] md:grid-cols-[auto_1fr]"
                    >
                      <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[color:var(--research-border)] font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-accent)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex flex-col gap-[8px]">
                        <p className="font-dmSans text-[19px] font-light leading-115 text-[color:var(--research-text)]">
                          {item.title}
                        </p>
                        <p className="font-dmSans text-[16px] leading-135 text-[color:var(--research-text-muted)]">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            );

          case 'callout': {
            const toneLabel =
              section.tone === 'risk'
                ? 'Risk note'
                : section.tone === 'systems'
                  ? 'Systems note'
                  : 'Signal';

            return (
              <aside
                key={section.id}
                className="research-callout rounded-[28px] px-[24px] py-[22px]"
              >
                <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-accent)]">
                  {toneLabel}
                </p>
                <h3 className="mt-[10px] font-dmSans text-[24px] font-light leading-110">
                  {section.title}
                </h3>
                <p className="mt-[12px] max-w-[64ch] font-dmSans text-[17px] leading-135 text-[color:var(--research-text-muted)]">
                  {section.body}
                </p>
              </aside>
            );
          }

          case 'keyPoints':
            return (
              <section key={section.id} className="flex flex-col gap-[18px]">
                <h3 className="font-dmSans text-[26px] font-light leading-110">
                  {section.title}
                </h3>
                <div className="grid gap-[14px] md:grid-cols-3">
                  {section.points.map((point) => (
                    <div
                      key={point.label}
                      className="research-outline-card rounded-[24px] px-[18px] py-[18px]"
                    >
                      <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                        {point.label}
                      </p>
                      <p className="mt-[12px] font-dmSans text-[24px] font-light leading-100">
                        {point.value}
                      </p>
                      {point.note ? (
                        <p className="mt-[10px] font-dmSans text-[15px] leading-130 text-[color:var(--research-text-muted)]">
                          {point.note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'quote':
            return (
              <blockquote
                key={section.id}
                className="research-outline-card rounded-[28px] px-[24px] py-[22px]"
              >
                <p className="font-dmSans text-[28px] font-light leading-110 tracking-m3p max-md:text-[24px]">
                  “{section.quote}”
                </p>
                {section.attribution ? (
                  <footer className="mt-[18px] font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                    {section.attribution}
                  </footer>
                ) : null}
              </blockquote>
            );

          case 'figure':
            return (
              <figure key={section.id} className="flex flex-col gap-[14px]">
                <div className="flex items-center justify-between gap-[16px]">
                  <h3 className="font-dmSans text-[26px] font-light leading-110">
                    {section.title}
                  </h3>
                </div>
                <div
                  className={`research-outline-card overflow-hidden rounded-[28px] p-[20px] ${
                    section.figure.aspect === 'square'
                      ? 'max-w-[440px]'
                      : 'w-full'
                  }`}
                >
                  {section.figure.imagePath ? (
                    <img
                      src={section.figure.imagePath}
                      alt={section.figure.alt ?? section.title}
                      className={`w-full rounded-[18px] object-cover ${
                        section.figure.aspect === 'square'
                          ? 'aspect-square'
                          : 'aspect-[16/9]'
                      }`}
                    />
                  ) : (
                    <div
                      className={`flex w-full items-center justify-center rounded-[18px] border border-dashed border-[color:var(--research-border)] bg-[color:var(--research-accent-soft)] font-diatype text-[12px] uppercase tracking-m3p text-[color:var(--research-text-muted)] ${
                        section.figure.aspect === 'square'
                          ? 'aspect-square'
                          : 'aspect-[16/9]'
                      }`}
                    >
                      {section.figure.placeholderLabel ?? 'Figure slot'}
                    </div>
                  )}
                </div>
                <figcaption className="max-w-[64ch] font-dmSans text-[15px] leading-130 text-[color:var(--research-text-muted)]">
                  {section.figure.caption}
                </figcaption>
              </figure>
            );

          case 'chart': {
            const maxValue = Math.max(...section.series.map((item) => item.value), 1);
            return (
              <section key={section.id} className="flex flex-col gap-[16px]">
                <h3 className="font-dmSans text-[26px] font-light leading-110">
                  {section.title}
                </h3>
                <div className="research-outline-card rounded-[28px] px-[20px] py-[20px]">
                  <div className="flex flex-col gap-[16px]">
                    {section.series.map((item) => (
                      <div key={item.label} className="flex flex-col gap-[8px]">
                        <div className="flex items-center justify-between gap-[16px]">
                          <p className="font-dmSans text-[16px] text-[color:var(--research-text)]">
                            {item.label}
                          </p>
                          <span className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]">
                            {item.value}
                          </span>
                        </div>
                        <div className="research-bar-track h-[10px] overflow-hidden rounded-full">
                          <div
                            className="research-bar-fill h-full rounded-full"
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                          />
                        </div>
                        {item.note ? (
                          <p className="font-dmSans text-[14px] leading-130 text-[color:var(--research-text-muted)]">
                            {item.note}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="max-w-[64ch] font-dmSans text-[15px] leading-130 text-[color:var(--research-text-muted)]">
                  {section.caption}
                </p>
              </section>
            );
          }

          case 'comparison':
            return (
              <section key={section.id} className="flex flex-col gap-[16px]">
                <h3 className="font-dmSans text-[26px] font-light leading-110">
                  {section.title}
                </h3>
                <div className="research-outline-card overflow-hidden rounded-[28px]">
                  <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b research-divider">
                    {section.columns.map((column) => (
                      <div
                        key={column}
                        className="px-[18px] py-[14px] font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]"
                      >
                        {column}
                      </div>
                    ))}
                  </div>
                  {section.rows.map((row, rowIndex) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[1.1fr_1fr_1fr] border-b last:border-b-0 research-divider"
                      style={{
                        background:
                          rowIndex % 2 === 0
                            ? 'transparent'
                            : 'var(--research-table-stripe)',
                      }}
                    >
                      <div className="px-[18px] py-[16px] font-dmSans text-[16px] leading-130">
                        {row.label}
                      </div>
                      <div className="px-[18px] py-[16px] font-dmSans text-[15px] leading-130 text-[color:var(--research-text-muted)]">
                        {row.values[0]}
                      </div>
                      <div className="px-[18px] py-[16px] font-dmSans text-[15px] leading-130 text-[color:var(--research-text-muted)]">
                        {row.values[1]}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'table': {
            const gridTemplateColumns = `repeat(${section.columns.length}, minmax(0, 1fr))`;

            return (
              <section key={section.id} className="flex flex-col gap-[16px]">
                <h3 className="font-dmSans text-[26px] font-light leading-110">
                  {section.title}
                </h3>
                <div className="research-outline-card overflow-hidden rounded-[28px]">
                  <div
                    className="border-b research-divider"
                    style={{
                      display: 'grid',
                      gridTemplateColumns,
                    }}
                  >
                    {section.columns.map((column) => (
                      <div
                        key={column}
                        className="px-[18px] py-[14px] font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-text-muted)]"
                      >
                        {column}
                      </div>
                    ))}
                  </div>
                  {section.rows.map((row, rowIndex) => (
                    <div
                      key={`${section.id}-row-${rowIndex}`}
                      className="border-b last:border-b-0 research-divider"
                      style={{
                        display: 'grid',
                        gridTemplateColumns,
                        background:
                          rowIndex % 2 === 0
                            ? 'transparent'
                            : 'var(--research-table-stripe)',
                      }}
                    >
                      {row.map((cell, cellIndex) => (
                        <div
                          key={`${section.id}-row-${rowIndex}-cell-${cellIndex}`}
                          className="px-[18px] py-[16px] font-dmSans text-[15px] leading-130 text-[color:var(--research-text-muted)]"
                        >
                          {cell}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case 'stat':
            return (
              <div
                key={section.id}
                className="research-callout rounded-[28px] px-[24px] py-[24px]"
              >
                <p className="font-diatype text-[11px] uppercase tracking-m3p text-[color:var(--research-accent)]">
                  {section.label}
                </p>
                <p className="mt-[14px] font-dmSans text-[32px] font-light leading-100 tracking-m3p max-md:text-[26px]">
                  {section.value}
                </p>
                {section.note ? (
                  <p className="mt-[12px] max-w-[64ch] font-dmSans text-[16px] leading-130 text-[color:var(--research-text-muted)]">
                    {section.note}
                  </p>
                ) : null}
              </div>
            );
        }
      })}
    </div>
  );
};

export default ResearchContentRenderer;
