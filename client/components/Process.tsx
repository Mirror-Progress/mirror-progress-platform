import React from 'react';
import { paragraphs } from '../constants';
import { LottieAnimation } from './';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
gsap.registerPlugin(ScrollTrigger);

const Process: React.FC = () => {
  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#paragraphs',
        toggleActions: 'restart none restart none',
        start: 'top 80%',
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
  return (
    <section className="pt-[50px] pb-[50px] basic-pd bg-[#0B3839] shadow-process-inset ">
      <div className="h-screen flex flex-col justify-center items-center gap-[80px]">
        <div className="lg:h-[600px] lg:w-[600px] max-md:w-[90%] flex justify-center items-center ">
          <LottieAnimation
            src="https://lottie.host/8f32ce3c-628c-44fa-b860-8c6bb1afec27/3ado51lgMu.lottie"
            loop={true}
            autoplay={true}
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
