import React, { useState } from 'react';
import { solutionSlides } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/all';

const Solutions: React.FC = () => {
  const [solutionId, setSolutionId] = useState(0);

  useGSAP(() => {
    CustomEase.create('bezier', '0, 0, 0, 0.99');
    if (solutionId < 6 && window.innerWidth > 768) {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: `#Solutions`,
            start: 'top top',
            end: '+=5000',
            scrub: 2,
            pin: true,
            toggleActions: 'play none none reverse',
            snap: {
              snapTo: (progress) => Math.round(progress * 5) / 5,
              duration: 0.5,
              ease: 'bezier',
            },
          },
        })
        .to(`#solution_0`, {
          left: 0,
          duration: 2,
        })
        .to(`#solution_0_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
        })
        .to(`#solution_1`, {
          left: `${1 * 13}%`,
          duration: 1.5,
          delay: 0.5,
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
        .to(`#solution_2`, {
          left: `${2 * 13}%`,
          duration: 1.5,
          delay: 0.5,
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
        .to(`#solution_3`, {
          left: `${3 * 13}%`,
          duration: 1.5,
          delay: 0.5,
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
        .to(`#solution_4`, {
          left: `${4 * 13}%`,
          duration: 1.5,
          delay: 0.5,
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
        .to(`#solution_5`, {
          left: `${5 * 13}%`,
          duration: 1.5,
          delay: 0.5,
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
    } else if (solutionId < 6 && window.innerWidth <= 768) {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: `#Solutions`,
            start: 'top top',
            end: '+=5000',
            scrub: 2,
            pin: true,
            toggleActions: 'play none none reverse',
            snap: {
              snapTo: (progress) => Math.round(progress * 5) / 5,
              duration: 0.5,
              ease: 'bezier',
            },
          },
        })
        .to(`#solution_0`, {
          top: 0,
          duration: 2,
        })
        .set(`#solution_0_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
        })
        .to(`#solution_1`, {
          top: `${1 * 10}%`,
          duration: 2,
          delay: 1,
        })
        .set(`#solution_1_content`, {
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
        .to(`#solution_2`, {
          top: `${2 * 10}%`,
          duration: 2,
          delay: 1,
        })
        .set(`#solution_2_content`, {
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
        .to(`#solution_3`, {
          top: `${3 * 10}%`,
          duration: 2,
          delay: 1,
        })
        .set(`#solution_3_content`, {
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
        .to(`#solution_4`, {
          top: `${4 * 10}%`,
          duration: 2,
          delay: 1,
        })
        .set(`#solution_4_content`, {
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
        .to(`#solution_5`, {
          top: `${5 * 10}%`,
          duration: 2,
          delay: 1,
        })
        .set(`#solution_5_content`, {
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
      className="h-screen max-w-full basic-pd  max-md:my-0 max-md:mt-[10px] static "
    >
      <div className="h-full w-full flex flex-col justify-evenly">
        <h2 className="uppercase max-md:my-0 max-md:mb-[10px] lg:pt-[10px] font-diatype font-extralight text-[24px] tracking-normal leading-100">
          [ Solutions ]
        </h2>
        <div
          id="solution_container"
          className="lg:h-[77%] w-full overflow-hidden flex flex-row justify-center items-center max-lg:flex-col relative  l:ml-[20px]"
        >
          {solutionSlides.map((s) => (
            <div
              id={`solution_${s.id}`}
              className={`flex md:w-[34%] lg:w-[32%]  bg-[#012727] md:h-[88%] max-md:h-[49%] lg:h-full max-md:w-full  max-md:flex-col max-md:justify-around absolute ${s.id === 0 ? 'lg:left-[20%] max-md:left-0 max-md:top-[40%]' : ''} ${s.id === 1 ? 'lg:left-[33%]  max-md:left-0 max-md:top-[50%]' : s.id === 2 ? ' lg:left-[46%] max-md:left-0 max-md:top-[60%]' : s.id === 3 ? ' lg:left-[59%] max-md:left-0 max-md:top-[70%]' : s.id === 4 ? ' lg:left-[72%] max-md:left-0 max-md:top-[80%]' : s.id === 5 ? ' lg:left-[85%] max-md:left-0 max-md:top-[90%]' : ''} `}
              key={s.id}
            >
              <div
                className={`lg:w-[1px] max-md:w-full  lg:h-full max-md:pb-[1px] ${s.id !== solutionId && s.id !== solutionId + 1 ? 'bg-[#126363]' : 'bg-white'}  `}
              ></div>
              <div
                className={`w-full max-md:h-full flex flex-col max-md:justify-evenly xl:gap-[88px]`}
              >
                <h4
                  className={`font-diatype uppercase pl-[8px]  tracking-normal font-extralight leading-100 max-w-[150px]  ${s.id === solutionId || (s.id === 5 && solutionId === 6) ? 'text-white' : 'text-[#126363]'} `}
                >
                  {s.title}
                </h4>
                <div
                  id={`solution_${s.id}_content`}
                  className={`md:relative w-full flex flex-col items-center md:opacity-0 max-md:h-[80%] max-md:gap-[8px] xl:gap-[64px] `}
                >
                  <div className="max-md:h-[65%] self-center h-[261px]">
                    <video
                      className="pointer-events-none h-full mx-auto"
                      autoPlay
                      loop
                      muted
                      playsInline={true}
                      key={s.title}
                    >
                      <source src={s.video.path} type="video/mp4" />
                    </video>
                  </div>
                  <p className="font-dmSans text-[18px] max-lg:text-[14px] leading-120 font-normal text-white lg:px-[30px] max-md:w-[300px] max-md:text-left max-md:self-start">
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
