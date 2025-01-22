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
                    y: '-200%',
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
                    y: '-180%',
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
      className="basic-pd shadow-process-inset h-screen flex flex-col justify-center items-center "
    >
      {/* bg-[#0B3839] */}
      <div className="w-full max-md:h-[50%] md:h-[90%] flex flex-col items-center max-md:gap-[64px] md:justify-evenly">
        <div className="md:h-[350px] md:w-[350px] max-md:w-[90%] flex justify-center items-center">
          <DotLottieReact
            id="lottie"
            src="/animation/process.lottie"
            className="md:h-[350px] md:w-[350px] max-md:h-[40vh]"
            dotLottieRefCallback={(instancePlayer) =>
              setDotLottie(instancePlayer)
            }
          />
        </div>
        <div id="paragraphs" className=" lg:h-[60px] flex flex-col">
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
