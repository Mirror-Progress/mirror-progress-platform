import React, { useEffect, useState } from 'react';
import { heroDecorativeMarkers, heroMP, paragraphs } from '../constants';
import { Header } from './';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CustomEase, ScrollTrigger } from 'gsap/all';

gsap.registerPlugin(CustomEase, ScrollTrigger);

interface HeroProps {
  onIntroComplete?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onIntroComplete }) => {
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
   * - Repeatedly tween each decorative marker to a random (x,y)
   * - On complete, pick a new random spot, etc.
   */
  const startRandomDrift = () => {
    const markerEls = document.querySelectorAll<HTMLElement>('[id^="hero-marker-"]');

    markerEls.forEach((el) => {
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
          top: '45%',
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
          top: '45%',
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

    // 3) Reveal hero markers + fade them in
    gsap
      .timeline()
      .from('[id^="hero-marker-"]', {
        top: '50%',
        left: '50%',
        xPercent: -50,
        yPercent: -50,
        duration: 1.5,
        delay: 1.5,
        ease: 'bezier',
      })
      .to('.hero-marker-asset', {
        opacity: 1,
        duration: 1,
        delay: 0.75,
        ease: 'bezier',
        onComplete: () => {
          // 4) Unlock scroll and reveal the rest of the page once hero is done
          setEndHeroAnimation(true);
          onIntroComplete?.();
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
   * Render: each marker has a unique "hero-marker-i" ID
   */
  return (
    <div
      id="hero"
      className="relative h-screen max-w-full overflow-hidden"
      style={{ background: 'var(--theme-hero-shell)' }}
    >
      <Header />
      <section className="basic-pd h-full absolute top-0 left-0 right-0">
        <div className="h-full flex items-center justify-center">
          <p
            className="z-[3] h-[138px] max-w-[650px] text-center font-dmSans text-[44px] font-light leading-100 tracking-3p max-md:max-w-[300px] max-md:text-[24px]"
            style={{ color: 'var(--theme-hero-copy)' }}
          >
            {paragraphs.hero}
          </p>
        </div>
      </section>

      <div className="w-full h-full sticky z-[1] flex items-center justify-center gap-[200px] max-md:gap-[50px] flex-wrap">
        {heroDecorativeMarkers.map((s, i) => (
          <div
            id={`hero-marker-${i}`}
            key={s.id}
            className={`w-[264px] h-[248px] max-md:w-[124.95px] max-md:h-[117.45px] absolute ${
              s.id === 0
                ? 'bottom-[90px] max-md:bottom-[47px] right-[50px] max-md:right-[40px]'
              : s.id === 1
                  ? 'bottom-[-20px] max-md:bottom-[194px] right-[340px] max-md:right-[222px]'
                  : s.id === 2
                    ? 'top-[-30px] max-md:top-[100px] left-[350px] max-md:left-[56px]'
                    : s.id === 3
                      ? 'top-[24px] max-md:top-[280px] right-[250px] max-md:right-[296px]'
                      : 'bottom-[132px] left-[80px] max-md:bottom-[250px] max-md:left-[205px]'
            }`}
          >
            <div
              className="flex h-[249px] w-[249px] items-center justify-center rounded-[69px] max-md:h-[117.45px] max-md:w-[117.4px] max-md:rounded-[24px]"
              style={{
                background: 'var(--theme-hero-marker-bg)',
                border: '1px solid var(--theme-hero-marker-border)',
                boxShadow: 'var(--theme-hero-marker-shadow)',
              }}
            >
              <div
                className="hero-marker-asset flex w-[190px] max-md:w-[84px] items-center justify-center opacity-0"
              >
                <img
                  src={s.image.path}
                  alt=""
                  aria-hidden="true"
                  className="max-h-[70px] max-md:max-h-[34px]"
                  style={{
                    opacity: 'var(--theme-hero-marker-icon-opacity)',
                    filter: 'var(--theme-hero-marker-icon-filter)',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gradients */}
      <div
        className="absolute top-0 left-0 z-0 hidden h-full w-[237px] md:block"
        style={{ background: 'var(--theme-hero-gradient-left)' }}
      />
      <div
        className="absolute top-0 right-0 z-0 h-full w-[237px] max-md:hidden"
        style={{ background: 'var(--theme-hero-gradient-right)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-0 h-[533px] md:hidden"
        style={{ background: 'var(--theme-hero-gradient-mobile)' }}
      />

      {/* Left Panel */}
      <div
        id="left"
        className="absolute top-0 left-0 z-[4] h-full w-1/2"
        style={{ background: 'var(--theme-hero-door)' }}
      >
        <div
          id="leftImg"
          className="absolute w-full top-[100%] flex justify-end"
        >
          <img
            src={heroMP.mirror.path}
            alt={heroMP.mirror.alt}
            className="pr-[1px] max-md:pr-[1px]"
          />
        </div>
      </div>

      {/* Right Panel */}
      <div
        id="right"
        className="absolute top-0 right-0 z-[4] h-full w-1/2"
        style={{ background: 'var(--theme-hero-door)' }}
      >
        <div id="rightImg" className="absolute w-full top-[100%] flex justify-start">
          <img
            src={heroMP.progress.path}
            alt={heroMP.progress.alt}
            className="pl-[5px] max-md:pl-[5px]"
          />
        </div>
      </div> 
    </div>
  );
};

export default Hero;
