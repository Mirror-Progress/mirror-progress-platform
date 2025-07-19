// pages/index.tsx
import { useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';

import Hero from '../components/Hero';
import Solutions from '../components/Solutions';
import Work from '../components/Work';
import Process from '../components/Process';
import Form from '../components/Form';
import Footer from '../components/Footer';

/* ------------------------------------------------------------------ */
/* 1 ▸ Config                                                         */
/* ------------------------------------------------------------------ */
const SHOW = { solutions: false, work: false, process: false };
const EXTRA  = SHOW.solutions || SHOW.work || SHOW.process;

/** 🔧 ONLY KNOB — compact-mode vertical gap (px) beneath Hero. */
const GAP = 142;          // ← set to 4, 8, 16, … if you ever want _some_ space

const SECTIONS = [
  'about',
  ...(SHOW.solutions ? ['solutions'] : []),
  ...(SHOW.work ? ['work'] : []),
  ...(SHOW.process ? ['process'] : []),
  'contact',
  'summary',
];

/* ------------------------------------------------------------------ */
/* 2 ▸ Hooks                                                          */
/* ------------------------------------------------------------------ */
function useSectionRefs(ids: string[]) {
  const refs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    ids.forEach(id => (refs.current[id] = document.getElementById(id)));
  }, [ids]);
  return refs;
}

function useActive(
  refs: React.MutableRefObject<Record<string, HTMLElement | null>>,
  compact: boolean,
) {
  const [active, setActive] = useState('about');
  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => e.isIntersecting && setActive(e.target.id)),
      compact
        ? { threshold: 0, rootMargin: '-75% 0px -15% 0px' }
        : { threshold: 0, rootMargin: '-30% 0px -60% 0px' },
    );
    Object.values(refs.current).forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, [refs, compact]);
  return active;
}

/* ------------------------------------------------------------------ */
/* 3 ▸ Page                                                           */
/* ------------------------------------------------------------------ */
const Home: NextPage = () => {
  const refs   = useSectionRefs(SECTIONS);
  const active = useActive(refs, !EXTRA);

  const [hover,   setHover]   = useState<string | null>(null);
  const [showNav, setShowNav] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowNav(true), 4500); return () => clearTimeout(t); }, []);

  /* ---------- Tailwind outer spacing ---------- */
  const heroCls    = EXTRA ? 'mb-12' : 'mb-0';
  const contactCls = EXTRA ? 'mt-12' : 'mt-0 pt-0';

  return (
    <>
      {/* --- Hero --- */}
      <section id="about" className={heroCls}>
        <Hero />
      </section>

      {/* --- Optional middle sections --- */}
      {SHOW.solutions && <section id="solutions"><Solutions /></section>}
      {SHOW.work      && <section id="work"><Work /></section>}
      {SHOW.process   && <section id="process"><Process /></section>}

      {/* --- Contact & footer --- */}
      <section id="contact" className={contactCls}>
        <Form />
      </section>
      <section id="summary"><Footer /></section>

      {/* --- Progress nav (unchanged) --- */}
      <nav
        className={`fixed z-10 flex gap-2 transition-opacity duration-500
          md:left-4 md:top-1/2 md:-translate-y-1/2 md:flex-col
          max-md:left-0 max-md:bottom-0 max-md:w-full max-md:h-6
          ${showNav ? 'opacity-100' : 'opacity-0'}`}
      >
        {SECTIONS.map(id => (
          <div
            key={id}
            className="relative cursor-pointer"
            style={{ padding: 16, margin: -16 }}
            onClick={() => refs.current[id]?.scrollIntoView({ behavior: 'smooth' })}
            onMouseEnter={() => setHover(id)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === id && (
              <span className="absolute -translate-y-6 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white">
                {id.toUpperCase()}
              </span>
            )}
            <div
              className={`relative rounded md:h-8 md:w-1 max-md:h-1 max-md:w-8 ${
                active === id ? 'bg-white' : 'bg-white/40'
              }`}
            />
          </div>
        ))}
      </nav>

      {/* ------------------------------------------------------------------
         Compact-mode overrides: trim Hero, zero out inner gap
         ------------------------------------------------------------------ */}
      {!EXTRA && (
        <style jsx global>{`
          #about,
          #about > * {
            border-bottom: none !important;
            min-height: 55vh !important;
            padding-bottom: 0 !important;
            margin-bottom: ${GAP}px !important;  /* ← the only gap now */
          }
          #contact,
          #contact > * {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
        `}</style>
      )}
    </>
  );
};

export default Home;
