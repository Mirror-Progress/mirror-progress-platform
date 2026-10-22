import React from "react";
import { site } from "./content/site";
import { symbolPaths, symbolViewBox, wordmarkPaths, wordmarkViewBox } from "./logo-paths";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-primary ${className}`}>
      <svg viewBox={symbolViewBox} className="h-6 w-auto" aria-hidden="true">
        {symbolPaths.map((d) => (
          <path key={d.slice(0, 24)} d={d} fill="currentColor" />
        ))}
      </svg>
      <svg viewBox={wordmarkViewBox} className="h-[15px] w-auto" aria-hidden="true">
        {wordmarkPaths.map((d) => (
          <path key={d.slice(0, 24)} d={d} fill="currentColor" />
        ))}
      </svg>
      <span className="sr-only">{site.name}</span>
    </span>
  );
}
