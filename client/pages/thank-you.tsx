import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import PublicSiteHeader from '../components/PublicSiteHeader';

const ThankYouPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Thank You | Mirror Progress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <section className="theme-page min-h-screen basic-pd py-[20px]">
        <PublicSiteHeader active="home" />
        <div className="mx-auto flex min-h-[72vh] max-w-4xl items-center justify-center">
          <div className="theme-panel rounded-[44px] px-[30px] py-[42px] text-center max-md:rounded-[30px] max-md:px-[20px]">
            <p className="theme-eyebrow font-diatype text-[12px] uppercase tracking-m3p">
              [ Inquiry received ]
            </p>
            <h1 className="mt-[16px] font-dmSans text-[58px] font-light leading-100 tracking-m3p max-md:text-[38px]">
              Thank you.
            </h1>
            <p className="theme-page-muted mx-auto mt-[18px] max-w-[620px] font-dmSans text-[18px] leading-125 max-md:text-[15px]">
              We received your note and will review the context you shared. If
              there is a strong fit, the next step is usually a focused
              readiness conversation around your systems, workflows, and AI
              adoption blockers.
            </p>
            <div className="mt-[28px] flex flex-wrap justify-center gap-[12px]">
              <Link
                href="/research"
                className="theme-secondary-button rounded-[999px] px-[18px] py-[11px] font-diatype text-[11px] uppercase tracking-m3p"
              >
                Read Research
              </Link>
              <Link
                href="/"
                className="theme-primary-button rounded-[999px] px-[18px] py-[11px] font-diatype text-[11px] uppercase tracking-m3p"
              >
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ThankYouPage;
