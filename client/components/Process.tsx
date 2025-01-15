import React, { useEffect, useRef, useState } from 'react';
import { paragraphs } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import { DotLottie, DotLottieReact } from '@lottiefiles/dotlottie-react';
gsap.registerPlugin(ScrollTrigger);

const Process: React.FC = () => {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>();

  useGSAP(() => {
    if (window.innerWidth > 768) {
      if (dotLottie) {
        gsap.to(dotLottie, {
          scrollTrigger: {
            trigger: '#lottie',
            start: 'top 16%',
            end: 'bottom top',
            onEnter: () => dotLottie.play(),
            onLeave: () => dotLottie.pause(),
            onEnterBack: () => dotLottie.play(),
          },
        });
      }
    } else {
      if (dotLottie) {
        gsap.to(dotLottie, {
          scrollTrigger: {
            trigger: '#lottie',
            start: 'top 41%',
            end: 'bottom top',
            onEnter: () => dotLottie.play(),
            onLeave: () => dotLottie.pause(),
            onEnterBack: () => dotLottie.play(),
          },
        });
      }
    }
  }, [dotLottie]);

  useGSAP(() => {
    if (window.innerWidth > 768) {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: '#lottie',
            toggleActions: 'restart none restart none',
            start: 'top 15%',
          },
        })
        .to('#p1', {
          y: -72,
          opacity: 0,
          duration: 0.5,
          delay: 3.3371703475460213,
        })
        .to('#p2', {
          y: -72,
          duration: 0.5,
          opacity: 1,
        })
        .to('#p3', {
          y: -72,
          duration: 0.5,
          opacity: 0,
        })
        .to('#p2', {
          y: -72 * 2,
          opacity: 0,
          duration: 0.5,
          delay: 1.5025024005734924,
        })
        .to('#p3', {
          y: -72 * 2,
          opacity: 1,
        });
    } else {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: '#lottie',
            toggleActions: 'restart none restart none',
            start: 'top 40%',
          },
        })
        .to('#p1', {
          y: -72,
          opacity: 0,
          duration: 0.5,
          delay: 3.3371703475460213,
        })
        .to('#p2', {
          y: -72,
          duration: 0.5,
          opacity: 1,
        })
        .to('#p3', {
          y: -72,
          duration: 0.5,
          opacity: 0,
        })
        .to('#p2', {
          y: -72 * 2,
          opacity: 0,
          duration: 0.5,
          delay: 1.5025024005734924,
        })
        .to('#p3', {
          y: -72 * 2,
          opacity: 1,
        });
    }
  }, []);

  return (
    <section className="pt-[50px] pb-[50px] basic-pd bg-[#0B3839] shadow-process-inset ">
      <div className="h-screen flex flex-col justify-center items-center gap-[80px]">
        <div className="md:h-[600px] md:w-[600px] max-md:w-[90%] flex justify-center items-center ">
          <DotLottieReact
            id="lottie"
            src="/animation/process.lottie"
            className="lg:h-[400px] lg:w-[400px] max-md:h-[40vh]"
            dotLottieRefCallback={(instancePlayer) =>
              setDotLottie(instancePlayer)
            }
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
