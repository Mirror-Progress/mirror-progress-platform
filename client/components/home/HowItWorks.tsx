import React from "react";
import { howItWorks } from "./content/how-it-works";

const illustrations = {
  background: (
    <>
      <path d="M8 76H136M30 63V76M72 57V76M116 48V76" opacity="0.25" />
      <path d="M15 22H45V42H29L20 49V42H15Z" />
      <path d="M23 29H37M23 35H32" opacity="0.5" />
      <path d="M58 12H77L86 21V53H58Z" />
      <path d="M77 12V21H86M65 30H79M65 37H79M65 44H73" />
      <path d="M105 24L112 31L126 16" />
      <circle cx="30" cy="76" r="3" fill="var(--background)" />
      <circle cx="72" cy="76" r="3" fill="var(--background)" />
      <circle cx="116" cy="76" r="4" className="fill-signal stroke-signal" />
    </>
  ),
  "existing-tools": (
    <>
      <path d="M9 26H51V76H9Z" />
      <path d="M17 66V37H43V50H30V66ZM17 50H25M34 37V44" />
      <path d="M64 28L91 13L118 28V58L91 73L64 58Z" />
      <path d="M64 28L91 43L118 28M91 43V73M78 21L105 36V51" opacity="0.5" />
      <path d="M101 62H136V85H101Z" fill="var(--background)" />
      <path d="M102 64L118.5 75L135 64" />
      <path d="M9 83H51M57 80H91" opacity="0.25" />
      <path d="M17 66H30" className="stroke-signal" strokeWidth="2" />
    </>
  ),
  decisions: (
    <>
      <path d="M10 12H38V46H10ZM10 56H38V90H10Z" />
      <path d="M17 20H31M17 27H27M17 64H31M17 71H27" opacity="0.5" />
      <path d="M17 36H31M17 80H24" className="stroke-signal" strokeWidth="2" />
      <path d="M38 29H55V51H86M38 73H55V51M80 46L86 51L80 56" />
      <circle cx="104" cy="51" r="17" />
      <circle cx="104" cy="46" r="4" />
      <path d="M96 59C96 51 112 51 112 59" />
      <path d="M121 51H134V12H57V24M52 19L57 24L62 19" opacity="0.35" />
    </>
  ),
};

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="site-container scroll-mt-28 py-24 sm:py-32"
    >
      <h2 id="how-it-works-title" className="section-title">
        {howItWorks.title}
      </h2>
      <ul role="list" className="mt-12 grid grid-cols-1 gap-12 sm:mt-16 lg:grid-cols-3 lg:gap-10">
        {howItWorks.items.map((item) => (
          <li key={item.id} className="min-w-0 border-t border-border pt-8">
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 144 96"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-7 h-24 w-36 max-w-full text-primary"
            >
              {illustrations[item.id]}
            </svg>
            <h3 className="max-w-[26ch] text-xl leading-7 font-medium text-primary lg:min-h-14">
              {item.title}
            </h3>
            <p className="mt-3 max-w-[42ch] text-base leading-7 text-muted-foreground">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
