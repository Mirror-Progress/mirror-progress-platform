import Link from 'next/link';
import React from 'react';
import AccountMenu from './AccountMenu';
import ThemeToggle from './ThemeToggle';
import BrandMark from './BrandMark';

interface PublicSiteHeaderProps {
  active?: 'home' | 'research';
}

const PublicSiteHeader: React.FC<PublicSiteHeaderProps> = ({
  active = 'research',
}) => {
  const baseLinkClass =
    'font-dmSans text-[15px] tracking-m3p transition hover:opacity-100';

  return (
    <header className="basic-pd sticky top-0 z-40 pt-[18px]">
      <div className="theme-panel mx-auto flex max-w-6xl items-center justify-between rounded-[28px] px-[18px] py-[14px] max-md:px-[14px]">
        <Link href="/" aria-label="Mirror Progress homepage">
          <BrandMark className="h-[26.93px] w-[28.85px] max-md:h-[22.4px] max-md:w-[24px]" />
        </Link>

        <nav className="flex items-center gap-[14px] max-md:gap-[10px]">
          <Link
            href="/"
            className={`${baseLinkClass} max-md:hidden ${
              active === 'home' ? 'opacity-100' : 'opacity-72'
            }`}
          >
            Home
          </Link>
          <Link
            href="/research"
            className={`${baseLinkClass} ${
              active === 'research' ? 'opacity-100' : 'opacity-72'
            }`}
          >
            Research
          </Link>
          <a
            href="/#capabilities"
            className={`${baseLinkClass} max-md:hidden opacity-72`}
          >
            What We do
          </a>
          <ThemeToggle className="max-md:hidden" />
          <AccountMenu className="max-md:order-2" />
          <Link
            className="theme-secondary-button inline-flex items-center rounded-[24px] px-[24px] py-[8px] text-center font-inter text-[14px] font-normal capitalize max-md:px-[18px]"
            href="/?skipIntro=contact#contact"
          >
            Get In Touch
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default PublicSiteHeader;
