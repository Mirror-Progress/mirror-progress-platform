import React, { useEffect, useState, useRef } from 'react';
import type { NextPage } from 'next';
import { Hero, Solutions, Process, Form, Footer } from '../components';

const sections = ['hero', 'solutions', 'process', 'form', 'footer'];

const Home: NextPage = () => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const solutionsProgressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    sections.forEach((id) => {
      sectionRefs.current[id] = document.getElementById(id);
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.4,
      }
    );

    Object.values(sectionRefs.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      sections.forEach((id) => {
        const section = sectionRefs.current[id];
        if (section) {
          const rect = section.getBoundingClientRect();
          if (
            rect.top < window.innerHeight * 0.6 &&
            rect.bottom > window.innerHeight * 0.4
          ) {
            setActiveSection(id);
          }
        }
      });

      const solutionsSection = sectionRefs.current['solutions'];
      if (solutionsSection && solutionsProgressRef.current) {
        const rect = solutionsSection.getBoundingClientRect();
        const progress = Math.min(
          Math.max((window.innerHeight - rect.top) / rect.height, 0),
          1
        );

        // Dynamically set width for smaller devices and height for larger devices
        if (window.innerWidth <= 768) {
          solutionsProgressRef.current.style.width =
            progress > 0 && progress < 1 ? `${progress * 100}%` : '0%';
          solutionsProgressRef.current.style.height = '100%';
        } else {
          solutionsProgressRef.current.style.height =
            progress > 0 && progress < 1 ? `${progress * 100}%` : '0%';
          solutionsProgressRef.current.style.width = '100%';
        }

        if (progress > 0 && progress < 1) {
          setActiveSection('solutions');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleProgressClick = (id: string) => {
    const section = sectionRefs.current[id];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Sections */}
      <section id="hero">
        <Hero />
      </section>
      <section id="solutions" className="relative">
        <Solutions />
      </section>
      <section id="process">
        <Process />
      </section>
      <section id="form">
        <Form />
      </section>
      <section id="footer">
        <Footer />
      </section>

      {/* Progress Indicator */}
      <div className="fixed z-10 md:left-[16px] md:top-[50%] md:translate-y-[-50%] max-md:bottom-0 max-md:left-0 max-md:w-full max-md:h-[24px] flex md:flex-col max-md:flex-row justify-center items-center">
        {sections.map((id) => (
          <div
            key={id}
            className={`relative cursor-pointer ${
              activeSection === id
                ? id === 'solutions'
                  ? 'bg-gray-500'
                  : 'bg-white'
                : 'bg-[#FFFFFF33]'
            } ${activeSection === id ? 'opacity-100' : 'opacity-50'} md:w-[3px] md:h-[24px] max-md:w-[33px] max-md:h-[5px]`}
            onClick={() => handleProgressClick(id)}
            onMouseEnter={() => setHoveredSection(id)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            {/* Tooltip */}
            {hoveredSection === id && (
              <div className="absolute max-md:top-[-40px] max-md:left-1/2 max-md:transform max-md:-translate-x-1/2 md:left-full md:top-1/2 md:-translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 animate-slide-right">
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </div>
            )}

            {/* Solutions Progress Bar */}
            {id === 'solutions' && (
              <div
                ref={solutionsProgressRef}
                className="absolute top-0 left-0 md:w-full md:h-[100%] max-md:h-full max-md:w-[0%] bg-white transition-all duration-250 ease-out"
              ></div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-right {
          0% {
            transform: translateX(-10px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-right {
          animation: slide-right 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Home;
