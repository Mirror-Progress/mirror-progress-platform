import React, { useEffect, useState, useRef } from 'react';
import type { NextPage } from 'next';
import { Hero, Solutions, Process, Form, Footer } from '../components';

const sections = ['hero', 'solutions', 'process', 'form', 'footer'];

const Home: NextPage = () => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const solutionsProgressRef = useRef<HTMLDivElement | null>(null);

  // Initialize section references
  useEffect(() => {
    sections.forEach((id) => {
      sectionRefs.current[id] = document.getElementById(id);
    });
  }, []);

  // Intersection observer for detecting visible sections
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
        threshold: 0.4, // Trigger when 40% of the section is visible
      }
    );

    Object.values(sectionRefs.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Scroll logic for dynamic section updates and solutions progress bar
  useEffect(() => {
    const handleScroll = () => {
      // Dynamically update the active section
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

      // Solutions-specific progress calculation
      const solutionsSection = sectionRefs.current['solutions'];
      if (solutionsSection && solutionsProgressRef.current) {
        const rect = solutionsSection.getBoundingClientRect();
        const progress = Math.min(
          Math.max((window.innerHeight - rect.top) / rect.height, 0),
          1
        );

        solutionsProgressRef.current.style.height =
          progress > 0 && progress < 1 ? `${progress * 100}%` : '0%';

        // Special case: Mark "solutions" section as active with gray background
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

  // Scroll to a section on progress click
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
      <div className="md:w-[3px] md:h-[136px] max-md:w-[176px] max-md:h-[3px] fixed z-10 md:top-[50%] md:translate-y-[-50%] md:left-[16px] md:flex md:flex-col md:justify-between">
        {sections.map((id) => (
          <div
            key={id}
            className={`md:w-full md:h-[24px] cursor-pointer relative ${
              activeSection === id
                ? id === 'solutions'
                  ? 'bg-gray-500' // Gray background for solutions section
                  : 'bg-white'
                : 'bg-[#FFFFFF33]'
            }`}
            onClick={() => handleProgressClick(id)}
            title={`Go to ${id}`}
          >
            {/* Solutions Progress Bar */}
            {id === 'solutions' && (
              <div
                ref={solutionsProgressRef}
                className="absolute top-0 left-0 w-full bg-white transition-height duration-250 ease-out"
                style={{ height: '0%' }}
              ></div>
            )}
            <div className="md:w-full md:h-[12px]"></div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;
