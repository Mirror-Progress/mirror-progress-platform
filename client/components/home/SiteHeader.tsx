import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { site } from "./content/site";

// Logo only, centered. The call to action sits under the headline.
export function SiteHeader() {
  return (
    <header className="mp-site-header">
      <div className="site-container flex h-[84px] items-center justify-center">
        <Link href="/" aria-label={site.homeLabel}>
          <Logo />
        </Link>
      </div>
    </header>
  );
}
