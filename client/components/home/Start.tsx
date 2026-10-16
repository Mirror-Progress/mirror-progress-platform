import React from "react";
import Link from "next/link";
import { start } from "./content/start";

export function StartSection() {
  return (
    <section
      id="start"
      aria-labelledby="start-title"
      className="site-container scroll-mt-28 py-24 sm:py-32"
    >
      <h2 id="start-title" className="section-title">
        {start.title}
      </h2>

      <ol role="list" className="mt-12 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-12">
        {start.steps.map((step, index) => (
          <li
            key={step.number}
            className="relative grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-5 md:block"
          >
            {index < start.steps.length - 1 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-5 bottom-[-2.5rem] left-5 border-l border-border md:bottom-auto md:w-[calc(100%+3rem)] md:border-t md:border-l-0"
              />
            )}
            <span
              aria-hidden="true"
              className="relative z-10 grid size-10 place-items-center rounded-full border border-border bg-background text-sm font-medium tabular-nums text-primary"
            >
              {step.number}
            </span>
            <p className="min-w-0 pt-1.5 text-base leading-relaxed text-muted-foreground sm:text-lg md:mt-6 md:pt-0">
              {step.text}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-12">
        <Link href={start.cta.href} className="cta-button before:!animate-none">
          {start.cta.label}
        </Link>
      </div>
    </section>
  );
}
