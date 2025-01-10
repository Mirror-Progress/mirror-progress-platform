import React, { useEffect, useRef } from 'react';
import { paragraphs } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
gsap.registerPlugin(ScrollTrigger);

const Process: React.FC = () => {
  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#paragraphs',
        toggleActions: 'restart none restart none',
        start: 'top 90%',
      },
    });
    tl.to('#p1', {
      y: -72,
      opacity: 0,
      duration: 0.5,
      delay: 1.2,
    })
      .to('#p2', {
        y: -72,
        opacity: 1,
      })
      .to('#p3', {
        y: -72,
        opacity: 0,
      })
      .to('#p2', {
        y: -72,
        opacity: 0,
        duration: 0.5,
        delay: 1.2,
      })
      .to('#p3', {
        y: -72 * 2,
        opacity: 1,
      });
  }, []);

  const lottieContainerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    // Initialize the Lottie animation using the DotLottieReact component's API
    if (lottieContainerRef.current) {
      const lottieInstance = lottieContainerRef.current.querySelector(
        'dot-lottie'
      ) as any;

      if (lottieInstance) {
        animationRef.current = lottieInstance.lottie;
      }
      if (lottieInstance) {
        animationRef.current = lottieInstance;
      }
    }

    ScrollTrigger.create({
      trigger: lottieContainerRef.current,
      start: 'top 80%',
      // end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        // Map scroll progress to the Lottie animation's progress
        const progress = self.progress; // 0 to 1
        if (animationRef.current) {
          animationRef.current.goToAndStop(
            progress * animationRef.current.totalFrames,
            true
          );
        }
      },
    });
  }, []);
  return (
    <section className="pt-[50px] pb-[50px] basic-pd bg-[#0B3839] shadow-process-inset ">
      <div className="h-screen flex flex-col justify-center items-center gap-[80px]">
        <div
          ref={lottieContainerRef}
          className="md:h-[600px] md:w-[600px] max-md:w-[90%] flex justify-center items-center "
        >
          <DotLottieReact
            src="/animation/process.lottie"
            loop
            autoplay
            className="lg:h-[400px] lg:w-[400px] max-md:h-[40vh]"
          />
        </div>
        <div id="paragraphs">
          <p
            id="p1"
            className="max-w-[900px] text-[32px] max-md:text-[24px] max-md:tracking-m3p font-light text-center font-dmSans "
          >
            {paragraphs.process[0]}
          </p>
          <p
            id="p2"
            className="max-w-[900px] text-[32px] max-md:text-[24px] max-md:tracking-m3p font-light text-center font-dmSans opacity-0"
          >
            {paragraphs.process[1]}
          </p>
          <p
            id="p3"
            className="max-w-[900px] text-[32px] max-md:text-[24px] max-md:tracking-m3p font-light text-center font-dmSans opacity-0"
          >
            {paragraphs.process[2]}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Process;
