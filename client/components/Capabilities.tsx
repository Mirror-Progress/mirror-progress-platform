import React, { useState } from 'react';
import { capabilityBuckets, paragraphs } from '../constants';

const Capabilities: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="theme-page basic-pd pt-[120px] pb-[72px] max-md:pt-[80px] max-md:pb-[40px]">
      <div className="mx-auto flex max-w-6xl flex-col gap-[48px]">
        <div className="flex flex-col gap-[20px] md:max-w-[760px]">
          <p className="font-diatype text-[14px] uppercase tracking-m3p text-[color:var(--theme-brand-ink)] opacity-70">
            [ Capabilities ]
          </p>
          <h2 className="font-dmSans text-[48px] font-light leading-100 tracking-m3p text-[color:var(--theme-brand-ink)] max-md:text-[32px]">
            The systems layer behind what comes next.
          </h2>
          <p className="max-w-[620px] font-dmSans text-[19px] leading-120 text-[color:var(--theme-brand-ink)] opacity-78 max-md:text-[16px]">
            {paragraphs.capabilities}
          </p>
        </div>

        <div className="grid gap-[16px] md:grid-cols-2">
          {capabilityBuckets.map((capability, index) => {
            const isOpen = openId === capability.id;

            return (
              <article
                key={capability.id}
                className={`group rounded-[32px] border text-left transition-all duration-300 ${
                  isOpen
                    ? 'theme-panel border-[color:var(--theme-border-strong)]'
                    : 'theme-marketing-card border-[color:var(--theme-marketing-card-border)]'
                }`}
              >
                <div className="flex h-full flex-col gap-[24px] px-[28px] py-[26px] max-md:px-[20px] max-md:py-[22px]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${capability.id}-content`}
                    onClick={() =>
                      setOpenId((current) =>
                        current === capability.id ? null : capability.id
                      )
                    }
                    className="flex w-full items-start justify-between gap-[20px] text-left"
                  >
                    <div className="flex min-w-0 flex-col gap-[14px]">
                      <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-dmSans text-[30px] font-light leading-100 tracking-m3p max-md:text-[24px]">
                        {capability.title}
                      </h3>
                    </div>

                    <span
                      className={`mt-[2px] inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full border font-diatype text-[14px] transition-all ${
                        isOpen
                          ? 'theme-primary-button border-transparent'
                          : 'theme-secondary-button text-[color:var(--theme-page-text-muted)]'
                      }`}
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  <p className="theme-page-muted max-w-[540px] font-dmSans text-[16px] leading-120 max-md:text-[15px]">
                    {capability.excerpt}
                  </p>

                  <div
                    id={`${capability.id}-content`}
                    className={`grid overflow-hidden transition-all duration-300 ${
                      isOpen
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="grid gap-[12px] pt-[6px]">
                        <div className="theme-card-soft rounded-[22px] px-[16px] py-[14px]">
                          <p className="theme-eyebrow font-diatype text-[10px] uppercase tracking-m3p">
                            Business cost
                          </p>
                          <p className="theme-page-muted mt-[8px] font-dmSans text-[14px] leading-125">
                            {capability.cost}
                          </p>
                        </div>
                        <div className="theme-card-soft rounded-[22px] px-[16px] py-[14px]">
                          <p className="theme-eyebrow font-diatype text-[10px] uppercase tracking-m3p">
                            Mirror Progress builds
                          </p>
                          <p className="theme-page-muted mt-[8px] font-dmSans text-[14px] leading-125">
                            {capability.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-[12px]">
                    <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
                      {isOpen ? 'Tap to close' : 'Tap to expand'}
                    </span>
                    <a
                      href={capability.offerHref}
                      className="theme-secondary-button rounded-[999px] px-[14px] py-[9px] font-diatype text-[10px] uppercase tracking-m3p"
                    >
                      {capability.offerLabel}
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Capabilities;
