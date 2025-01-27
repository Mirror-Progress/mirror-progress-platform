import React, { useState } from 'react';
import { solutionSlides } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/all';

const Solutions: React.FC = () => {
  const [solutionId, setSolutionId] = useState(0);

  useGSAP(() => {
    CustomEase.create('bezier', '0, 0, 0, 0.99');
    if (solutionId < 6 && window.innerWidth > 1024) {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: `#Solutions`,
            start: 'top top',
            end: '+=5000',
            scrub: 8,
            pin: true,
            toggleActions: 'play none none reverse',
            snap: {
              snapTo: (progress) => Math.round(progress * 5) / 5,
              duration: 0.5,
              ease: 'bezier',
            },
          },
        })
        .to(`#highlight_line_0`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#highlight_title_0`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_0`, {
          left: 0,
          duration: 1,
          onStart: () => {
            gsap.fromTo(
              `#solution_0_content`,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.5,
                ease: 'bezier',
              }
            );
          },
          onReverseComplete: () => {
            gsap.to(`#solution_0_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
            });
          },
        })
        .to(`#highlight_line_1`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_0', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_0', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_1`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_1`, {
          left: `${1 * 12}%`,
          duration: 1,
          delay: 0.2,
          onStart: () => {
            gsap.fromTo(
              `#solution_1_content`,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.5,
                ease: 'bezier',
              }
            );
          },
          onReverseComplete: () => {
            gsap.to(`#solution_1_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
            });
          },
        })
        .to(`#highlight_line_2`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_1', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_1', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_2`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_2`, {
          left: `${2 * 12}%`,
          duration: 1,
          delay: 0.2,
          onStart: () => {
            gsap.fromTo(
              `#solution_2_content`,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.5,
                ease: 'bezier',
              }
            );
          },
          onReverseComplete: () => {
            gsap.to(`#solution_2_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
            });
          },
        })

        .to(`#highlight_line_3`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_2', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_2', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_3`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_3`, {
          left: `${3 * 12}%`,
          duration: 1,
          delay: 0.2,
          onStart: () => {
            gsap.fromTo(
              `#solution_3_content`,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.5,
                ease: 'bezier',
              }
            );
          },
          onReverseComplete: () => {
            gsap.to(`#solution_3_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
            });
          },
        })

        .to(`#highlight_line_4`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_3', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_3', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_4`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_4`, {
          left: `${4 * 12}%`,
          duration: 1,
          delay: 0.2,
          onStart: () => {
            gsap.fromTo(
              `#solution_4_content`,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.5,
                ease: 'bezier',
              }
            );
          },
          onReverseComplete: () => {
            gsap.to(`#solution_4_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
            });
          },
        })

        .to(`#highlight_line_5`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_4', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_4', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_5`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_5`, {
          left: `${5 * 12}%`,
          duration: 1,
          delay: 0.2,
          onStart: () => {
            gsap.fromTo(
              `#solution_5_content`,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.5,
                ease: 'bezier',
              }
            );
          },
          onReverseComplete: () => {
            gsap.to(`#solution_5_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
            });
          },
        });
    } else if (solutionId < 6 && window.innerWidth <= 1023) {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: `#Solutions`,
            start: 'top top',
            end: '+=5000',
            scrub: 8,
            pin: true,
            toggleActions: 'play none none reverse',
            snap: {
              snapTo: (progress) => Math.round(progress * 5) / 5,
              duration: 0.5,
              ease: 'bezier',
            },
          },
        })
        .to(`#highlight_line_0`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#highlight_title_0`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_0`, {
          top: 0,
          duration: 1,
        })
        .to(`#solution_0_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
        })
        .to(`#highlight_line_1`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_0', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_0', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_1`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_1`, {
          top: `${1 * 8}%`,
          duration: 1,
          delay: 0.2,
        })
        .to(`#solution_1_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
          onStart: () => {
            gsap.to(`#solution_0_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
        })
        .to(`#highlight_line_2`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_1', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_1', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_2`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_2`, {
          top: `${2 * 8}%`,
          duration: 1,
          delay: 0.2,
        })
        .to(`#solution_2_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
          onStart: () => {
            gsap.to(`#solution_1_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
        })
        .to(`#highlight_line_3`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_2', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_2', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_3`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_3`, {
          top: `${3 * 8}%`,
          duration: 1,
          delay: 0.2,
        })
        .to(`#solution_3_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
          onStart: () => {
            gsap.to(`#solution_2_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
        })
        .to(`#highlight_line_4`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_3', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_3', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_4`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_4`, {
          top: `${4 * 8}%`,
          duration: 1,
          delay: 0.2,
        })
        .to(`#solution_4_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
          onStart: () => {
            gsap.to(`#solution_3_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
        })
        .to(`#highlight_line_5`, {
          backgroundColor: 'white',
          duration: 0.1,
          ease: 'bezier',
          onStart: () => {
            gsap.set('#highlight_title_4', { color: '#126363', duration: 0.1 });
            gsap.set('#highlight_line_4', {
              backgroundColor: '#126363',
              duration: 0.1,
            });
          },
        })
        .to(`#highlight_title_5`, {
          color: 'white',
          duration: 0.1,
          ease: 'bezier',
        })
        .to(`#solution_5`, {
          top: `${5 * 8}%`,
          duration: 1,
          delay: 0.2,
        })
        .to(`#solution_5_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
          onStart: () => {
            gsap.to(`#solution_4_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
        });
    } else {
      return;
    }
  }, []);

  return (
    <section
      id="Solutions"
      className="h-screen max-sm:min-h-screen max-w-full basic-pd  max-md:my-0 max-md:mt-[10px] static max-sm:mb-[120px]"
    >
      <div className="h-full max-sm:min-h-full w-full flex flex-col justify-evenly">
        <h2 className="uppercase max-md:my-0 max-md:mb-[10px] lg:pt-[10px] font-diatype font-extralight text-[24px] tracking-normal leading-100">
          [ Solutions ]
        </h2>
        <div
          id="solution_container"
          className="lg:h-[77%] max-lg:h-[90%] max-sm:min-h-[90%] w-full max-lg:w-full overflow-hidden  flex lg:flex-row max-lg:flex-col lg:justify-center lg:items-center  relative  lg:ml-[20px]"
        >
          {solutionSlides.map((s) => (
            <div
              id={`solution_${s.id}`}
              className={`flex lg:w-[35%] xl:w-[32%] max-lg:w-[95%] max-sm:w-full bg-[#012727] max-lg:h-[43%] max-sm:h-[60%]   lg:h-full  max-lg:flex-col max-lg:justify-around absolute ${s.id === 0 ? 'lg:left-[20%]  max-lg:top-[40%] max-sm:top-[50%] ' : ''} ${s.id === 1 ? 'lg:left-[33%]  max-lg:top-[60%] ' : s.id === 2 ? ' lg:left-[46%] max-lg:top-[70%] ' : s.id === 3 ? ' lg:left-[59%] max-lg:top-[80%] ' : s.id === 4 ? ' lg:left-[72%]  max-lg:top-[90%]  ' : s.id === 5 ? ' lg:left-[85%]  max-lg:top-[100%]' : ''} `}
              key={s.id}
            >
              <div
                id={`highlight_line_${s.id}`}
                className={`lg:w-[1px] max-lg:w-full  lg:h-full max-lg:pb-[1px]  bg-[#126363] `}
              ></div>
              <div
                className={`lg:w-full max-lg:w-full max-lg:h-full max-sm:h-full  flex flex-col max-lg:justify-evenly  bg-[#012727]`}
              >
                <h4
                  id={`highlight_title_${s.id}`}
                  className={`font-diatype uppercase lg:pl-[8px] max-lg:pt-[8px]  tracking-normal font-extralight leading-100 lg:max-w-[150px] max-sm:max-w-[150px] text-[#126363] `}
                >
                  {s.title}
                </h4>
                <div
                  id={`solution_${s.id}_content`}
                  className={`md:relative  max-lg:w-full max-lg:h-full  flex-1 self-center flex flex-col  max-lg:flex-row-reverse max-sm:flex-col  max-lg:justify-between lg:items-center lg:self-start xl:items-center lg:justify-evenly  lg:w-full  max-md:gap-[8px] max-sm:justify-evenly  md:opacity-0 bg-[#012727]`}
                >
                  <div className=" max-lg:pr-[50px] max-sm:pr-0 bg-[#012727] ">
                    <video
                      className="pointer-events-none h-[261px] mx-auto lg:pl-[10px] "
                      autoPlay
                      loop
                      muted
                      playsInline={true}
                      key={s.title}
                    >
                      <source src={s.video.path} type="video/mp4" />
                    </video>
                  </div>
                  <p className="font-dmSans text-[16px] lg:text-[15px] max-sm:text-[14px] leading-120 font-normal text-white  max-md:text-left max-lg:self-end max-md:self-start lg:pr-[10px] xl:pl-[10px] max-[480px]:w-[320px] max-sm:max-w-[300px] w-[375px]    max-lg:translate-y-[-30px] max-md:translate-y-[-30px] max-sm:translate-y-0 bg-[#012727] ">
                    {s.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solutions;





/*
import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger, CustomEase } from 'gsap/all';
import { useGSAP } from '@gsap/react';
import { solutionSlides } from '../constants';

// Register GSAP plugins on the client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
}

/** 
 * Helpers to pick step sizes based on breakpoints.
 * Adjust as needed for your layout.
 
function getStepSizeForHorizontal(): number {
  const w = window.innerWidth;
  if (w >= 1280) return 14;
  if (w >= 1024) return 13.5;
  if (w > 768)   return 13;
  return 13; 
}

function getStepSizeForVertical(): number {
  const w = window.innerWidth;
  if (w >= 768)  return 10;
  if (w >= 480)  return 10;
  if (w >= 393)  return 9;
  if (w >= 375)  return 8.5;
  if (w >= 320)  return 8;
  return 7;
}

const Solutions: React.FC = () => {
  const [solutionId] = useState(0);

  // Store refs to <video> so we can manually .play()
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // We'll store the GSAP timeline in a ref, so we can kill it if needed
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    // Kill existing timeline if it exists (cleanup)
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    // Create custom ease
    CustomEase.create('bezier', '0, 0, 0, 0.99');

    const horizontalStep = getStepSizeForHorizontal();
    const verticalStep   = getStepSizeForVertical();

    // Helper to pause & reset all videos except index
    function resetAllVideosExcept(index: number) {
      videoRefs.current.forEach((vid, idx) => {
        if (!vid) return;
        vid.pause();
        vid.currentTime = 0;
      });
      const currentVid = videoRefs.current[index];
      if (currentVid) {
        currentVid.play().catch(() => {/* handle autoplay restrictions });
      }
    }

    // Build timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#Solutions',
        start: 'top top',
        end: '+=5000',
        scrub: window.innerWidth > 768 ? 8 : 2,
        pin: true,
        toggleActions: 'play none none reverse',
        snap: {
          snapTo: (progress) => Math.round(progress * 5) / 5,
          duration: 0.5,
          ease: 'bezier',
        },
      },
    });

    // =========== Desktop / Larger Screens (Horizontal) ===========
    if (solutionId < 6 && window.innerWidth > 768) {
      // We'll chain each slide's animation. 
      // As soon as we "to" the drawer left: X, we'll do a parallel or 
      // fromTo fade in for the content so it appears as the drawer moves.

      // Slide 0
      tl
        .to('#highlight_line_0', { backgroundColor: 'white', duration: 0.1 })
        .to('#highlight_title_0', { color: 'white', duration: 0.1 })
        // Move solution_0 in
        .to('#solution_0', { left: 0, duration: 1 })
        // Reveal content gradually in parallel
        .fromTo(
          '#solution_0_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onComplete: () => resetAllVideosExcept(0),
          },
          '<' // start at the same time as solution_0 or near the end
        )

        // Slide 1
        .to('#highlight_line_1', {
          backgroundColor: 'white',
          duration: 0.1,
          onStart: () => {
            gsap.set('#highlight_title_0', { color: '#126363' });
            gsap.set('#highlight_line_0', { backgroundColor: '#126363' });
          },
        })
        .to('#highlight_title_1', { color: 'white', duration: 0.1 })
        .to('#solution_1', {
          left: `${1 * horizontalStep}%`,
          duration: 1, 
          delay: 0.2,
        })
        .fromTo(
          '#solution_1_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_0_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(1),
          },
          '<'
        )

        // Slide 2
        .to('#highlight_line_2', {
          backgroundColor: 'white',
          duration: 0.1,
          onStart: () => {
            gsap.set('#highlight_title_1', { color: '#126363' });
            gsap.set('#highlight_line_1', { backgroundColor: '#126363' });
          },
        })
        .to('#highlight_title_2', { color: 'white', duration: 0.1 })
        .to('#solution_2', {
          left: `${2 * horizontalStep}%`,
          duration: 1,
          delay: 0.2,
        })
        .fromTo(
          '#solution_2_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_1_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(2),
          },
          '<'
        )

        // Slide 3
        .to('#highlight_line_3', {
          backgroundColor: 'white',
          duration: 0.1,
          onStart: () => {
            gsap.set('#highlight_title_2', { color: '#126363' });
            gsap.set('#highlight_line_2', { backgroundColor: '#126363' });
          },
        })
        .to('#highlight_title_3', { color: 'white', duration: 0.1 })
        .to('#solution_3', {
          left: `${3 * horizontalStep}%`,
          duration: 1,
          delay: 0.2,
        })
        .fromTo(
          '#solution_3_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_2_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(3),
          },
          '<'
        )

        // Slide 4
        .to('#highlight_line_4', {
          backgroundColor: 'white',
          duration: 0.1,
          onStart: () => {
            gsap.set('#highlight_title_3', { color: '#126363' });
            gsap.set('#highlight_line_3', { backgroundColor: '#126363' });
          },
        })
        .to('#highlight_title_4', { color: 'white', duration: 0.1 })
        .to('#solution_4', {
          left: `${4 * horizontalStep}%`,
          duration: 1,
          delay: 0.2,
        })
        .fromTo(
          '#solution_4_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_3_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(4),
          },
          '<'
        )

        // Slide 5
        .to('#highlight_line_5', {
          backgroundColor: 'white',
          duration: 0.1,
          onStart: () => {
            gsap.set('#highlight_title_4', { color: '#126363' });
            gsap.set('#highlight_line_4', { backgroundColor: '#126363' });
          },
        })
        .to('#highlight_title_5', { color: 'white', duration: 0.1 })
        .to('#solution_5', {
          left: `${5 * horizontalStep}%`,
          duration: 1,
          delay: 0.2,
        })
        .fromTo(
          '#solution_5_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_4_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(5),
          },
          '<'
        );

    // =========== Mobile / Smaller Screens (Vertical) ===========
    } else if (solutionId < 6 && window.innerWidth <= 768) {
      tl
        .to('#solution_0', { top: 0, duration: 2 })
        // Fade in content as it slides
        .fromTo(
          '#solution_0_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onComplete: () => resetAllVideosExcept(0),
          },
          '<'
        )
        // Slide 1
        .to('#solution_1', {
          top: `${1 * verticalStep}%`,
          duration: 2,
          delay: 1,
        })
        .fromTo(
          '#solution_1_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_0_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(1),
          },
          '<'
        )
        // Slide 2
        .to('#solution_2', {
          top: `${2 * verticalStep}%`,
          duration: 2,
          delay: 1,
        })
        .fromTo(
          '#solution_2_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_1_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(2),
          },
          '<'
        )
        // Slide 3
        .to('#solution_3', {
          top: `${3 * verticalStep}%`,
          duration: 2,
          delay: 1,
        })
        .fromTo(
          '#solution_3_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_2_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(3),
          },
          '<'
        )
        // Slide 4
        .to('#solution_4', {
          top: `${4 * verticalStep}%`,
          duration: 2,
          delay: 1,
        })
        .fromTo(
          '#solution_4_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_3_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(4),
          },
          '<'
        )
        // Slide 5
        .to('#solution_5', {
          top: `${5 * verticalStep}%`,
          duration: 2,
          delay: 1,
        })
        .fromTo(
          '#solution_5_content',
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            onStart: () =>
              gsap.to('#solution_4_content', { opacity: 0, duration: 0.2 }),
            onComplete: () => resetAllVideosExcept(5),
          },
          '<'
        );
    } else {
      return;
    }

    tlRef.current = tl;

    // Cleanup
    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
    };
  }, []);

  return (
    <section
      id="Solutions"
      className="h-screen max-w-full basic-pd max-md:my-0 max-md:mt-[10px] static"
    >
      <div className="h-full w-full flex flex-col justify-evenly">
        <h2 className="uppercase max-md:my-0 max-md:mb-[10px] lg:pt-[10px] font-diatype font-extralight text-[24px] tracking-normal leading-100">
          [ Solutions ]
        </h2>

        <div
          id="solution_container"
          className="lg:h-[77%] w-full overflow-hidden flex flex-row 
                     justify-center items-center max-lg:flex-col relative lg:ml-[20px]"
        >
          {solutionSlides.map((s) => (
            <div
              key={s.id}
              id={`solution_${s.id}`}
              className={`
                flex md:w-[34%] lg:w-[32%] bg-[#012727] md:h-[88%] max-md:h-[49%] 
                lg:h-full max-md:w-full max-md:flex-col max-md:justify-around 
                absolute
                ${
                  s.id === 0
                    ? 'lg:left-[20%] max-md:left-0 max-md:top-[40%]'
                    : ''
                }
                ${
                  s.id === 1
                    ? 'lg:left-[33%] max-md:left-0 max-md:top-[50%]'
                    : s.id === 2
                    ? 'lg:left-[46%] max-md:left-0 max-md:top-[60%]'
                    : s.id === 3
                    ? 'lg:left-[59%] max-md:left-0 max-md:top-[70%]'
                    : s.id === 4
                    ? 'lg:left-[72%] max-md:left-0 max-md:top-[80%]'
                    : s.id === 5
                    ? 'lg:left-[85%] max-md:left-0 max-md:top-[90%]'
                    : ''
                }
              `}
            >
              <div
                id={`highlight_line_${s.id}`}
                className="lg:w-[1px] max-md:w-full lg:h-full max-md:pb-[1px] bg-[#126363]"
              ></div>

              <div className="w-full max-md:h-full flex flex-col max-md:justify-evenly">
                <h4
                  id={`highlight_title_${s.id}`}
                  className="font-diatype uppercase pl-[8px] tracking-normal 
                             font-extralight leading-100 max-w-[150px] 
                             text-[#126363]"
                >
                  {s.title}
                </h4>

                <div
                  id={`solution_${s.id}_content`}
                  // IMPORTANT: No default "opacity-0" class here.
                  className="md:relative flex-1 self-center flex flex-col 
                             items-center lg:justify-evenly lg:w-[95%] 
                             max-md:h-[80%] max-md:gap-[8px]"
                >
                  <div className="max-md:h-[65%] self-center h-[261px]">
                    <video
                      ref={(el) => (videoRefs.current[s.id] = el)}
                      className="pointer-events-none h-full mx-auto lg:pl-[10px]"
                      preload="auto"
                      loop
                      muted
                      playsInline
                      // no autoPlay => first frame is shown from the start
                      key={s.title}
                    >
                      <source src={s.video.path} type="video/mp4" />
                    </video>
                  </div>

                  <p className="font-dmSans text-[16px] max-lg:text-[14px] leading-120 
                                font-normal text-white max-md:w-[300px] 
                                max-md:text-left max-md:self-start lg:pl-[10px]"
                  >
                    {s.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// If you need to disable SSR in Next.js to avoid DOM mismatch:
export default dynamic(() => Promise.resolve(Solutions), { ssr: false });
*/
