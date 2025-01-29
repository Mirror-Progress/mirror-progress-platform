import React, { useEffect, useState } from 'react';
import { heroMP, paragraphs, solutionSlides } from '../constants';
import { Header } from './';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CustomEase, ScrollTrigger } from 'gsap/all';

gsap.registerPlugin(CustomEase, ScrollTrigger);

const Hero: React.FC = () => {
  /* Manages whether hero animation is done */
  const [endHeroAnimation, setEndHeroAnimation] = useState(false);

  useEffect(() => {
    // Lock or unlock scrolling based on hero animation
    if (endHeroAnimation) {
      document.body.style.overflowY = 'auto';
      document.body.style.overflowX = 'hidden';
    } else {
      document.body.style.overflowY = 'hidden';
      document.body.style.overflowX = 'hidden';
    }
  }, [endHeroAnimation]);

  /**
   * Random drift function:
   * - Repeatedly tween each solution to a random (x,y)
   * - On complete, pick a new random spot, etc.
   */
  const startRandomDrift = () => {
    // For each solution element, define a function that keeps chaining tweens
    const solEls = document.querySelectorAll<HTMLElement>('[id^="solution-"]');

    solEls.forEach((el) => {
      // We'll store the original transform or position
      // so we can keep offsets relative to that if desired.
      const rect = el.getBoundingClientRect();
      const baseX = rect.left;
      const baseY = rect.top;

      // A recursive function that sets up a random tween, then repeats
      const drift = () => {
        const randomX = gsap.utils.random(-30, 30); 
        const randomY = gsap.utils.random(-30, 30);

        gsap.to(el, {
          duration: 3,
          x: `+=${randomX}`, // relative move
          y: `+=${randomY}`,
          ease: 'power1.inOut',
          onComplete: drift, // once done, repeat
        });
      };

      // Start drifting
      drift();
    });
  };

  /**
   * GSAP animations (doors, fade-out, etc.).
   * Once the main hero animation finishes, we'll call startRandomDrift().
   */
  useGSAP(() => {
    // 1) Custom Ease
    CustomEase.create('bezier', '0, 0, 0, 0.99');

    // 2) Door opening animations
    if (window.innerWidth > 768) {
      // Desktop
      gsap
        .timeline()
        .to('#leftImg', {
          top: '50%',
          duration: 1,
          ease: 'bezier',
        })
        .to('#leftImg', {
          left: '-100%',
          duration: 0.5,
          ease: 'bezier',
        })
        .to('#left', {
          left: '-100%',
          duration: 0.25,
          ease: 'bezier',
        });

      gsap
        .timeline()
        .to('#rightImg', {
          top: '50%',
          duration: 1,
          ease: 'bezier',
        })
        .to('#rightImg', {
          right: '-100%',
          duration: 0.5,
          ease: 'bezier',
        })
        .to('#right', {
          right: '-100%',
          duration: 0.25,
          ease: 'bezier',
        });
    } else {
      // Mobile
      gsap
        .timeline()
        .to('#leftImg', {
          top: '50%',
          duration: 1,
          ease: 'bezier',
        })
        .to('#leftImg', {
          opacity: 0,
          duration: 0.5,
          ease: 'bezier',
        })
        .to('#left', {
          top: '-100%',
          duration: 0.25,
          ease: 'bezier',
        });

      gsap
        .timeline()
        .to('#rightImg', {
          top: '50%',
          duration: 1,
          ease: 'bezier',
        })
        .to('#rightImg', {
          opacity: 0,
          duration: 0.5,
          ease: 'bezier',
        })
        .to('#right', {
          top: '-100%',
          duration: 0.25,
          ease: 'bezier',
        });
    }

    // 3) Reveal solution elements + fade in #wait
    //    Using [id^="solution-"] so all slides are included
    gsap
      .timeline()
      .from('[id^="solution-"]', {
        top: '50%',
        left: '50%',
        xPercent: -50,
        yPercent: -50,
        duration: 1.5,
        delay: 1.5,
        ease: 'bezier',
      })
      .to('#wait', {
        opacity: 1,
        duration: 1,
        delay: 0.75,
        ease: 'bezier',
        onComplete: () => {
          // 4) Unlock scroll & Start the random drifting once hero is done
          setEndHeroAnimation(true);
          startRandomDrift();
        },
      });

    // 5) Fade out hero on scroll
    gsap.to('#hero', {
      opacity: 0,
      ease: 'bezier',
      scrollTrigger: {
        trigger: '#hero',
        scrub: true,
        start: 'bottom 60%',
      },
    });
  }, []);

  /**
   * Render: each solution has a unique "solution-i" ID
   */
  return (
    <div id="hero" className="relative h-screen max-w-full overflow-hidden">
      <Header />
      <section className="basic-pd h-full absolute top-0 left-0 right-0">
        <div className="h-full flex items-center justify-center">
          <p className="font-dmSans max-w-[650px] max-md:max-w-[300px] h-[138px] text-center font-light text-[44px] max-md:text-[24px] tracking-3p leading-100 z-[3]">
            {paragraphs.hero}
          </p>
        </div>
      </section>

      <div className="w-full h-full sticky z-[1] flex items-center justify-center gap-[200px] max-md:gap-[50px] flex-wrap">
        {solutionSlides.map((s, i) => (
          <div
            id={`solution-${i}`}
            key={s.id}
            className={`w-[264px] h-[248px] max-md:w-[124.95px] max-md:h-[117.45px] absolute ${
              // your original positioning logic
              s.id === 0
                ? 'bottom-[90px] max-md:bottom-[47px] right-[50px] max-md:right-[40px]'
                : s.id === 1
                ? 'bottom-[-50px] max-md:bottom-[190px] right-[358px]  max-md:right-[231px]'
                : s.id === 2
                ? 'top-[-50px] max-md:top-[102px] left-[350px] max-md:left-[70px]'
                : s.id === 3
                ? 'top-[20px] max-md:top-[282px] right-[250px] max-md:right-[304px]'
                : s.id === 4
                ? 'top-[157px] max-md:top-[209px] left-[30px] max-md:left-[238px]'
                : s.id === 5
                ? 'bottom-[15px] max-md:bottom-[264px] left-[295px] max-md:left-[280px]'
                : ''
            }`}
          >
            <div
              id="wait"
              className="w-[16px] h-[16px] border-[1px] border-white bg-[#022D2D] border-opacity-30 absolute top-1/2 left-[-8px] opacity-0 max-md:hidden"
            />
            <div
              id="wait"
              className="w-[16px] h-[16px] border-[1px] border-white border-opacity-30 bg-[#022D2D] absolute top-1/2 right-[8px] opacity-0 max-md:hidden"
            />
            <div className="w-[249px] h-[249px] max-md:w-[117.4px] max-md:h-[117.45px] bg-[#023333] bg-opacity-50 rounded-[69px] max-md:rounded-[24px] flex justify-center items-center">
              <div
                id="wait"
                className="w-[175px] h-[113px] max-md:w-[75.92px] max-md:h-[69.08px] opacity-0 flex items-center"
              >
                <img src={s.image.path} alt={s.title} className="opacity-30" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gradients */}
      <div className="w-[237px] h-full absolute bg-gradient-to-l to-[#1D2222FF] from-[#1D222200]  top-0 left-0 z-0 max-md:w-full max-md:h-[533px] max-md:right-0 max-md:bg-gradient-to-t" />
      <div
        className="w-[237px] h-full absolute
        bg-gradient-to-l to-[#1D222200] from-[#1D2222FF] top-0 right-0 z-0 max-md:hidden"
      />

      {/* Left Panel */}
      <div
        id="left"
        className="h-full w-1/2 absolute top-0 left-0 bg-[#1D2222] z-[4]"
      >
        <div id="leftImg" className="absolute w-full top-[100%] flex justify-end">
          <img
            src={heroMP.mirror.path}
            alt={heroMP.mirror.alt}
            className="pr-[3px]"
          />
        </div>
      </div>

      {/* Right Panel */}
      <div
        id="right"
        className="h-full w-1/2 absolute top-0 right-0 bg-[#1D2222] z-[4]"
      >
        <div id="rightImg" className="absolute w-full top-[100%]">
          <img
            src={heroMP.progress.path}
            alt={heroMP.progress.alt}
            className="pl-[3px]"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
