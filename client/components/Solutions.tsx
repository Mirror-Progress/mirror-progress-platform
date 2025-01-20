import React, { useState } from 'react';
import { solutionSlides } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const Solutions: React.FC = () => {
  const [solutionId, setSolutionId] = useState(0);

  useGSAP(() => {
    if (solutionId < 6 && window.innerWidth > 768) {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: `#Solutions`,
            start: 'top top',
            scrub: true,
            pin: true,
            toggleActions: 'play none none reverse',
          },
        })
        .to(`#solution_0`, {
          left: 0,
          duration: 0.5,
        })
        .to(`#solution_0_content`, {
          opacity: 1,
          duration: 0.5,
        })
        .to(`#solution_1`, {
          left: `${1 * 13}%`,
          duration: 0.5,
        })
        .to(`#solution_1_content`, {
          opacity: 1,
          duration: 0.5,
          onStart: () => {
            gsap.to(`#solution_0_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
        })
        .to(`#solution_2`, {
          left: `${2 * 13}%`,
          duration: 0.5,
        })
        .to(`#solution_2_content`, {
          opacity: 1,
          duration: 0.5,
          onStart: () => {
            gsap.to(`#solution_1_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
        })
        .to(`#solution_3`, {
          left: `${3 * 13}%`,
          duration: 0.5,
        })
        .to(`#solution_3_content`, {
          opacity: 1,
          duration: 0.5,
          onStart: () => {
            gsap.to(`#solution_2_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
        })
        .to(`#solution_4`, {
          left: `${4 * 13}%`,
          duration: 0.5,
        })
        .to(`#solution_4_content`, {
          opacity: 1,
          duration: 0.5,
          onStart: () => {
            gsap.to(`#solution_3_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
        })
        .to(`#solution_5`, {
          left: `${5 * 13}%`,
          duration: 0.5,
        })
        .to(`#solution_5_content`, {
          opacity: 1,
          duration: 0.5,
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
            trigger: `#solution_${solutionId}`,
            start: 'top 80%',
            end: 'bottom 10%',
            toggleActions: 'play stop resume none',
          },
        })
        .to(`#solution_${solutionId}`, {
          height: 350,
          top: solutionId * 75,
          duration: 0.9,
          delay: 0.5,
        })
        .to(`#solution_${solutionId}_content`, {
          opacity: 1,
          duration: 0.5,
          onStart: () => {
            gsap.to(`#solution_${solutionId >= 1 && solutionId - 1}_content`, {
              opacity: 0,
              duration: 0.02,
            });
          },
          onComplete: () => {
            setSolutionId((prev) => prev + 1);
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
              //  bg-black
              id={`solution_${s.id}`}
              className={`lg:h-full flex lg:w-[28%] bg-[#012727] max-lg:h-full max-lg:w-full  max-lg:flex-col absolute ${s.id === 0 ? 'lg:left-[15%] max-lg:left-0 max-lg:top-[225px]' : ''} ${s.id === 1 ? 'lg:left-[30%]  max-lg:left-0 max-lg:top-[300px]' : s.id === 2 ? ' lg:left-[45%] max-lg:left-0 max-lg:top-[375px]' : s.id === 3 ? ' lg:left-[60%] max-lg:left-0 max-lg:top-[450px]' : s.id === 4 ? ' lg:left-[75%] max-lg:left-0 max-lg:top-[525px]' : s.id === 5 ? ' lg:left-[90%] max-lg:left-0 max-lg:top-[600px]' : ''} `}
              key={s.id}
            >
              <div
                className={`lg:w-[1px] max-lg:w-full max-lg:h-[1px]  ${s.id !== solutionId && s.id !== solutionId + 1 ? 'bg-[#126363]' : 'bg-white'} ${s.id === 5 && solutionId === 6 ? 'bg-white' : ''} `}
              ></div>
              <div
                className={`${s.id === solutionId ? 'max-lg:h-[60px] ' : 'max-lg:h-[361px]'} max-lg:flex max-lg:flex-col w-full max-lg:justify-around  lg: justify-start max-lg:mt-[10px] `}
              >
                <h4
                  className={`font-diatype uppercase pl-[8px] tracking-normal font-medium leading-105 max-w-[150px]  ${s.id === solutionId || (s.id === 5 && solutionId === 6) ? 'text-white' : 'text-[#126363]'} `}
                >
                  {s.title}
                </h4>
                <div
                  id={`solution_${s.id}_content`}
                  className={`md:relative lg:flex-1  max-lg:max-w-full h-[455px] w-full max-lg:h-[250px] flex flex-col items-center max-lg:items-start justify-around max-lg:my-0 opacity-0 `}
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
                  <p className="max-w-full  max-lg:max-w-full font-dmSans text-[18px] max-lg:text-[14px] leading-120 font-normal text-[#A2A2A2] lg:px-[10px]">
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
