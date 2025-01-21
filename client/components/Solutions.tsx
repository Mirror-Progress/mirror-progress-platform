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
            end: 'top -10%',
            scrub: 5,
            pin: true,
            toggleActions: 'play none none reverse',
          },
        })
        .to(`#solution_0`, {
          left: 0,
          duration: 3,
        })
        .to(`#solution_0_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
        })
        .to(`#solution_1`, {
          left: `${1 * 13}%`,
          duration: 3,
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
          duration: 3,
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
          duration: 3,
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
          duration: 3,
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
          duration: 3,
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
            end: 'top -10%',
            scrub: 5,
            pin: true,
            toggleActions: 'play none none reverse',
          },
        })
        .to(`#solution_0`, {
          top: 0,
          duration: 3,
        })
        .to(`#solution_0_content`, {
          opacity: 1,
          duration: 0.5,
          ease: 'bezier',
        })
        .to(`#solution_1`, {
          top: `${1 * 10}%`,
          duration: 3,
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
          top: `${2 * 10}%`,
          duration: 3,
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
          top: `${3 * 10}%`,
          duration: 3,
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
          top: `${4 * 10}%`,
          duration: 1.5,
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
          top: `${5 * 10}%`,
          duration: 3,
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
  }, [solutionId]);

  return (
    <section
      id="Solutions"
      className="h-screen max-w-full basic-pd  max-md:my-0 max-md:mt-[10px]"
    >
      <div className="h-full w-full flex flex-col">
        <h2 className="uppercase max-md:my-0 max-md:mb-[10px]  lg:pt-[10px] font-diatype font-medium text-[24px]">
          [ Solutions ]
        </h2>
        <div
          id="solution_container"
          className="h-full w-full overflow-hidden flex flex-row justify-center items-center max-lg:flex max-lg:flex-col lg:relative max-lg:relative py-[30px] "
        >
          {solutionSlides.map((s) => (
            <div
              id={`solution_${s.id}`}
              className={`lg:h-full flex lg:w-[33%] bg-[#012727] max-lg:h-full max-md:h-[28%] max-md:w-full  max-md:flex-col absolute ${s.id === 0 ? 'lg:left-[19%] max-md:left-0 max-md:top-[40%]' : ''} ${s.id === 1 ? 'lg:left-[34%]  max-md:left-0 max-md:top-[50%]' : s.id === 2 ? ' lg:left-[49%] max-md:left-0 max-md:top-[60%]' : s.id === 3 ? ' lg:left-[64%] max-md:left-0 max-md:top-[70%]' : s.id === 4 ? ' lg:left-[79%] max-md:left-0 max-md:top-[80%]' : s.id === 5 ? ' lg:left-[94%] max-md:left-0 max-md:top-[90%]' : ''} `}
              key={s.id}
            >
              <div
                className={`lg:w-[1px] max-md:w-full max-md:pb-[2px] ${s.id !== solutionId && s.id !== solutionId + 1 ? 'bg-[#126363]' : 'bg-white'}  `}
              ></div>
              <div
                className={`flex w-full flex-col max-md:justify-center lg:justify-start `}
              >
                <h4
                  className={`font-diatype uppercase pl-[8px] pt-[8px] tracking-normal font-medium leading-105 max-w-[150px]  ${s.id === solutionId || (s.id === 5 && solutionId === 6) ? 'text-white' : 'text-[#126363]'} `}
                >
                  {s.title}
                </h4>
                <div
                  id={`solution_${s.id}_content`}
                  className={`md:relative flex-1 w-full  flex flex-col items-center max-lg:items-start justify-around max-lg:my-0 opacity-0 max-md:pt-[20px] `}
                >
                  <div className=" h-[120px] lg:h-[250px] md:h-[300px] self-center md:absolute lg:static md:top-[-20%] md:right-[20px] ">
                    <video
                      className="pointer-events-none h-full "
                      autoPlay
                      loop
                      muted
                      playsInline={true}
                      key={s.title}
                    >
                      <source src={s.video.path} type="video/mp4" />
                    </video>
                  </div>
                  <p className="font-dmSans text-[18px] max-lg:text-[14px] leading-120 font-normal text-[#A2A2A2] lg:pl-[10px]  max-md:pt-[50px]">
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
