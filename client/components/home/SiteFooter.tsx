import React from "react";
import Image from "next/image";
import { affiliations, contactEmail } from "./content/site";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="site-container grid gap-6 py-8 text-sm text-muted-foreground">
        <ul aria-label={affiliations.label} className="flex flex-wrap items-center gap-x-10 gap-y-4">
          {affiliations.items.map((a) => (
            <li key={a.name} className="flex items-center gap-3">
              <span>{a.prefix}</span>
              <a href={a.href} aria-label={a.name} className="flex items-center gap-1.5 opacity-85 transition-opacity hover:opacity-100">
                <Image src={a.logo.src} alt={a.logo.alt} width={a.logo.width} height={a.logo.height} className={`${a.logo.className} w-auto`} />
                {a.suffix && <span className="text-[15px] font-medium text-[#151514]">{a.suffix}</span>}
              </a>
            </li>
          ))}
        </ul>
        <a href={`mailto:${contactEmail}`} className="w-fit select-text hover:text-primary">{contactEmail}</a>
      </div>
    </footer>
  );
}
