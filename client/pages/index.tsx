/* ------------------------------------------------------------------ */
/* pages/index.tsx (client / server safe)                             */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import Hero from '../components/Hero';
import Capabilities from '../components/Capabilities';
import Form from '../components/Form';
import Footer from '../components/Footer';

/* ------------------------------------------------------------------ */
/* 1 ▸ Config                                                         */
/* ------------------------------------------------------------------ */
const GAP = 88;

const SECTIONS = ['about', 'capabilities', 'contact', 'summary'];

/* ------------------------------------------------------------------ */
/* 2 ▸ Utility hooks                                                  */
/* ------------------------------------------------------------------ */
const useSectionRefs = (ids: string[]) => {
  const refs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => { ids.forEach(id => (refs.current[id] = document.getElementById(id))); }, [ids]);
  return refs;
};

const useActive = (
  refs:   React.MutableRefObject<Record<string, HTMLElement | null>>,
  compact: boolean,
) => {
  const [active, set] = useState('about');
  useEffect(() => {
    const io = new IntersectionObserver(
      list => list.forEach(e => e.isIntersecting && set(e.target.id)),
      compact
        ? { threshold: 0, rootMargin: '-75% 0px -15% 0px' }
        : { threshold: 0, rootMargin: '-30% 0px -60% 0px' },
    );
    Object.values(refs.current).forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [refs, compact]);
  return active;
};

/* ------------------------------------------------------------------ */
/* 3 ▸ Page                                                           */
/* ------------------------------------------------------------------ */
const Home: NextPage = () => {
  const refs = useSectionRefs(SECTIONS);
  const active = useActive(refs, false);
  const [introComplete, setIntroComplete] = useState(false);

  const [hover, setHover] = useState<string | null>(null);

  return (
    <>
      <section id="about" className="relative min-h-screen overflow-hidden">
        <Hero onIntroComplete={() => setIntroComplete(true)} />
      </section>

      <div
        className={introComplete ? 'visible opacity-100' : 'invisible opacity-0'}
        aria-hidden={!introComplete}
      >
        <section id="capabilities">
          <Capabilities />
        </section>

        {/* ===== Contact & Footer ===== */}
        <section id="contact">
          <Form />
        </section>
        <section id="summary">
          <Footer />
        </section>
      </div>

      {/* ===== Progress nav ===== */}
      <nav
        className={`fixed z-10 flex
          gap-0                       md:gap-2
          transition-opacity duration-500
          md:left-4 md:top-1/2 md:-translate-y-1/2 md:flex-col
          max-md:left-0 max-md:bottom-0 max-md:w-full max-md:h-6
          max-md:flex-row max-md:items-center max-md:justify-center
          ${introComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {SECTIONS.map(id => (
          <div
            key={id}
            className="relative cursor-pointer p-2 m-0 md:p-4 md:-m-4"
            onClick={() => refs.current[id]?.scrollIntoView({ behavior: 'smooth' })}
            onMouseEnter={() => setHover(id)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === id && (
              <span className="theme-panel-strong absolute -translate-y-6 whitespace-nowrap rounded px-2 py-1 text-xs">
                {id.toUpperCase()}
              </span>
            )}
            <div
              className={`
                relative rounded
                md:h-8 md:w-1
                max-md:h-1 max-md:w-8
                ${active === id ? 'theme-status-line' : 'bg-[color:var(--theme-border)]'}
              `}
            />
          </div>
        ))}
      </nav>

      <style jsx global>{`
        #about,
        #about > * {
          border-bottom: none !important;
          padding-bottom: 0 !important;
          margin-bottom: ${GAP}px !important;
        }
      `}</style>
    </>
  );
};

export default Home;
