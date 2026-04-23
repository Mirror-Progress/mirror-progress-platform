import Link from 'next/link';
import React from 'react';
import AccountMenu from '../../components/AccountMenu';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

const WelcomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <section className="theme-page basic-pd min-h-screen py-[32px]">
      <div className="mx-auto flex max-w-5xl flex-col gap-[24px]">
        <div className="flex items-center justify-between gap-[16px]">
          <Link
            href="/"
            className="theme-page-muted font-diatype text-[12px] uppercase tracking-m3p transition hover:text-[color:var(--theme-page-text)]"
          >
            Back Home
          </Link>
          <div className="flex items-center gap-[10px]">
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>

        <div className="flex min-h-[78vh] items-center justify-center">
          <div className="theme-panel w-full max-w-[640px] rounded-[40px] px-[36px] py-[44px] text-center max-md:rounded-[28px] max-md:px-[22px]">
            <span className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
              Account
            </span>
            <h1 className="mt-[18px] font-dmSans text-[48px] font-light leading-100 tracking-m3p max-md:text-[34px]">
              Thanks for creating an account, check back in the future for more
              features
            </h1>
            {user ? (
              <p className="theme-page-subtle mt-[24px] font-diatype text-[12px] uppercase tracking-m3p">
                Signed in as {user.email}
              </p>
            ) : null}
            <Link
              href="/workspace"
              className="theme-primary-button mt-[28px] inline-flex rounded-[999px] px-[18px] py-[12px] font-diatype text-[12px] uppercase tracking-m3p"
            >
              Open Client Workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomePage;
