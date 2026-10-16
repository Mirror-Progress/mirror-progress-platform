/* ------------------------------------------------------------------ */
/* pages/index.tsx: one-page homepage (Oct 2026 refresh)              */
/* ------------------------------------------------------------------ */
import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { SiteHeader } from '../components/home/SiteHeader';
import { HomeHero } from '../components/home/HomeHero';
import { HowItWorksSection } from '../components/home/HowItWorks';
import { AlwaysOnSection } from '../components/home/AlwaysOn';
import { WhoSection } from '../components/home/Who';
import { StartSection } from '../components/home/Start';
import { ContactSection } from '../components/home/ContactSection';
import { SiteFooter } from '../components/home/SiteFooter';
import { hero } from '../components/home/content/site';

// Kept abstract on purpose: enough to start a conversation, not enough to reveal focus or approach.
// Styling is scoped under .mp-home in styles/globals.css and always renders light.
const Home: NextPage = () => (
  <div className="mp-home">
    <Head>
      <title>Mirror Progress</title>
      <meta name="description" content={hero.title} />
    </Head>
    <SiteHeader />
    <HomeHero />
    <HowItWorksSection />
    <AlwaysOnSection />
    <WhoSection />
    <StartSection />
    <ContactSection />
    <SiteFooter />
  </div>
);

export default Home;
