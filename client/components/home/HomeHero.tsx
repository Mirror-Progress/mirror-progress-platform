import React from "react";
import Link from "next/link";
import { HeroDots } from "./HeroDots";
import { hero } from "./content/site";

// Centered headline and button over a dot field that lifts into a building. Fills the first screen (84px is the header).
export function HomeHero() {
  return (
    <section aria-labelledby="hero-title">
      <div className="relative isolate min-h-[max(34rem,calc(100svh-84px))] overflow-hidden bg-[radial-gradient(ellipse_60%_55%_at_50%_100%,#e6f4f1_0%,#f6fbfb_45%,#ffffff_80%)]">
        <HeroDots className="absolute inset-x-0 bottom-0 -z-10 h-[78%] w-full [mask-image:radial-gradient(ellipse_70%_95%_at_50%_100%,#000_60%,transparent_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_bottom,transparent,#ffffff)]" />
        <div id="hero-copy" className="mx-auto grid max-w-4xl justify-items-center gap-8 px-4 pt-28 text-center sm:pt-[9.5rem]">
          <h1 id="hero-title" className="max-w-[22ch] text-[clamp(2.2rem,5vw,3.9rem)] font-medium leading-[1.05] tracking-[-0.025em] text-primary">
            {hero.title}
          </h1>
          <Link href={hero.primary.href} className="cta-button">
            {hero.primary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
