import React, { useEffect, useRef, useState } from 'react';
import { paragraphs } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import { DotLottie, DotLottieReact } from '@lottiefiles/dotlottie-react';
gsap.registerPlugin(ScrollTrigger);

const Process: React.FC = () => {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>();
  const [lottieProgess, setLottieProgess] = useState(0);

  useGSAP(() => {
    if (window.innerWidth > 768) {
      if (dotLottie) {
        gsap.to(dotLottie, {
          scrollTrigger: {
            trigger: '#Process_Section',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            pin: true,
            pinSpacing: false,
            onUpdate: ({ progress }) => {
              const tl = gsap.timeline();
              const frame = Math.round(progress * dotLottie.totalFrames);
              dotLottie.setFrame(frame);
              if (frame < 150) {
                tl.to('#p1', {
                  y: '0%',
                  opacity: 1,
                  duration: 0.5,
                })
                  .to('#p2', {
                    y: '0%',
                    opacity: 0,
                  })
                  .to('#p3', {
                    y: '0%',
                    opacity: 0,
                  });
              } else if (frame >= 150 && frame < 226) {
                tl.to('#p1', {
                  y: '-100%',
                  opacity: 0,
                  duration: 0.5,
                })
                  .to('#p2', {
                    y: '-100%',
                    opacity: 1,
                    duration: 0.5,
                  })
                  .to('#p3', {
                    y: '0%',
                    opacity: 0,
                  });
              } else if (frame >= 226 && frame < 284) {
                tl.to('#p1', {
                  y: '-200%',
                  opacity: 0,
                  duration: 0.5,
                })
                  .to('#p2', {
                    y: '-200%',
                    duration: 0.5,
                    opacity: 0,
                  })
                  .to('#p3', {
                    y: '-150%',
                    duration: 0.5,
                    opacity: 1,
                  });
              }
            },
          },
        });
      }
    } else {
      if (dotLottie) {
        gsap.to(dotLottie, {
          scrollTrigger: {
            trigger: '#Process_Section',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            pin: true,
            pinSpacing: false,
            onUpdate: ({ progress }) => {
              const tl = gsap.timeline();
              const frame = Math.round(progress * dotLottie.totalFrames);
              dotLottie.setFrame(frame);
              if (frame < 150) {
                tl.to('#p1', {
                  y: '0%',
                  opacity: 1,
                  duration: 0.5,
                })
                  .to('#p2', {
                    y: '0%',
                    opacity: 0,
                  })
                  .to('#p3', {
                    y: '0%',
                    opacity: 0,
                  });
              } else if (frame >= 150 && frame < 226) {
                tl.to('#p1', {
                  y: '-100%',
                  opacity: 0,
                  duration: 0.5,
                })
                  .to('#p2', {
                    y: '-100%',
                    opacity: 1,
                    duration: 0.5,
                  })
                  .to('#p3', {
                    y: '0%',
                    opacity: 0,
                  });
              } else if (frame >= 226 && frame < 284) {
                tl.to('#p1', {
                  y: '-200%',
                  opacity: 0,
                  duration: 0.5,
                })
                  .to('#p2', {
                    y: '-200%',
                    duration: 0.5,
                    opacity: 0,
                  })
                  .to('#p3', {
                    y: '-150%',
                    duration: 0.5,
                    opacity: 1,
                  });
              }
            },
          },
        });
      }
    }
  }, [dotLottie]);

  return (
    <section
      id="Process_Section"
      className="basic-pd bg-[#0B3839] shadow-process-inset h-screen lg:pt-[50px] max-md:flex max-md:items-center"
    >
      <div className="w-full flex flex-col justify-center items-center max-md:gap-[100px] ">
        <div className="md:h-[400px]  md:w-[400px] max-md:w-[90%] flex justify-center items-center ">
          <DotLottieReact
            id="lottie"
            src="/animation/process.lottie"
            className="md:h-[400px] md:w-[400px] max-md:h-[40vh]"
            dotLottieRefCallback={(instancePlayer) =>
              setDotLottie(instancePlayer)
            }
          />
        </div>
        <div
          id="paragraphs"
          className="lg:mt-[50px] max-md:mt-[50px] flex-1 flex flex-col"
        >
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
            className="max-w-full text-[32px] max-md:text-[24px] max-md:tracking-m3p font-light text-center font-dmSans opacity-0"
          >
            {paragraphs.process[2]}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Process;
