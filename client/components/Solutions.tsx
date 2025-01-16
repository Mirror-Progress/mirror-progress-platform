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
            trigger: `#solution_${solutionId}`,
            start: 'top 25%',
            end: 'bottom 80%',
            toggleActions: 'play stop resume none',
          },
        })
        .to(`#solution_${solutionId}`, {
          zIndex: solutionId,
          width: 370,
          left: solutionId * 185,
          duration: 0.5,
          delay: 1,
        })
        .to(`#solution_${solutionId}_content`, {
          opacity: 1,
          duration: 0.5,
          onStart: () => {
            gsap.to(`#solution_${solutionId >= 1 && solutionId - 1}_content`, {
              opacity: 0,
              duration: 0.2,
            });
          },
          onComplete: () => {
            setSolutionId((prev) => prev + 1);
          },
        });
      // gsap
      //   .timeline({
      //     scrollTrigger: {
      //       trigger: `#Solutions`,
      //       start: 'top -10%',
      //       scrub:true,
      //       pin:true,
      //       toggleActions: 'play none none resume',
      //     },
      //   })
      //   .to(`#solution_0`, {
      //     zIndex: 0,
      //     width: 370,
      //     left: 0,
      //     duration: 0.5,
      //   })
      //   .to(`#solution_0_content`, {
      //     opacity: 1,
      //     duration: 0.5,
      //   })
      //   .to(`#solution_1`, {
      //     zIndex: 1,
      //     width: 370,
      //     left: 1 * 185,
      //     duration: 0.5,
      //   })
      //   .to(`#solution_1_content`, {
      //     opacity: 1,
      //     duration: 0.5,
      //     onStart: () => {
      //       gsap.to(`#solution_0_content`, {
      //         opacity: 0,
      //         duration: 0.2,
      //       });
      //     },
      //   })
      //   .to(`#solution_2`, {
      //     zIndex: 1,
      //     width: 370,
      //     left: 2 * 185,
      //     duration: 0.5,
      //   })
      //   .to(`#solution_2_content`, {
      //     opacity: 1,
      //     duration: 0.5,
      //     onStart: () => {
      //       gsap.to(`#solution_1_content`, {
      //         opacity: 0,
      //         duration: 0.2,
      //       });
      //     },
      //   })
      //   .to(`#solution_3`, {
      //     zIndex: 1,
      //     width: 370,
      //     left: 3 * 185,
      //     duration: 0.5,
      //   })
      //   .to(`#solution_3_content`, {
      //     opacity: 1,
      //     duration: 0.5,
      //     onStart: () => {
      //       gsap.to(`#solution_2_content`, {
      //         opacity: 0,
      //         duration: 0.2,
      //       });
      //     },
      //   })
      //   .to(`#solution_4`, {
      //     zIndex: 1,
      //     width: 370,
      //     left: 4 * 185,
      //     duration: 0.5,
      //   })
      //   .to(`#solution_4_content`, {
      //     opacity: 1,
      //     duration: 0.5,
      //     onStart: () => {
      //       gsap.to(`#solution_3_content`, {
      //         opacity: 0,
      //         duration: 0.2,
      //       });
      //     },
      //   })
      //   .to(`#solution_5`, {
      //     zIndex: 1,
      //     width: 370,
      //     left: 5 * 185,
      //     duration: 0.5,
      //   })
      //   .to(`#solution_5_content`, {
      //     opacity: 1,
      //     duration: 0.5,
      //     onStart: () => {
      //       gsap.to(`#solution_4_content`, {
      //         opacity: 0,
      //         duration: 0.2,
      //       });
      //     },
      //   });
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
          zIndex: solutionId,
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
      className="h-screen max-w-full basic-pd   max-md:my-0 max-md:mt-[10px] "
    >
      <div className="h-full w-full flex flex-col">
        <h2 className="uppercase max-md:my-0 max-md:mb-[10px]  lg:pt-[10px] font-diatype font-normal text-[24px]">
          [ Solutions ]
        </h2>
        <div
          id="solution_container"
          className="min-h-[80%] max-w-full flex flex-row max-lg:flex max-lg:flex-col lg:relative max-lg:relative py-[30px]"
        >
          {solutionSlides.map((s) => (
            <div
              id={`solution_${s.id}`}
              className={`flex lg:w-[185px] bg-[#012727] max-lg:h-full max-lg:w-full  max-lg:flex-col absolute ${s.id === 0 ? 'lg:left-[185px] max-lg:left-0 max-lg:top-[225px]' : ''} ${s.id === 1 ? 'lg:left-[370px]  max-lg:left-0 max-lg:top-[300px]' : s.id === 2 ? ' lg:left-[555px] max-lg:left-0 max-lg:top-[375px]' : s.id === 3 ? ' lg:left-[740px] max-lg:left-0 max-lg:top-[450px]' : s.id === 4 ? ' lg:left-[925px] max-lg:left-0 max-lg:top-[525px]' : s.id === 5 ? ' lg:left-[1110px] max-lg:left-0 max-lg:top-[600px]' : ''} `}
              /*  */
              key={s.id}
            >
              <div
                className={`lg:w-[1px] max-lg:w-full max-lg:h-[1px]  ${s.id !== solutionId && s.id !== solutionId + 1 ? 'bg-[#126363]' : 'bg-white'} ${s.id === 5 && solutionId === 6 ? 'bg-white' : ''} `}
              ></div>
              <div
                className={`${s.id === solutionId ? 'max-lg:h-[60px]' : 'max-lg:h-[361px]'} max-lg:flex max-lg:flex-col max-lg:justify-around max-lg:mt-[10px] `}
              >
                <h4
                  className={`font-diatype uppercase pl-[12px] leading-100 font-normal max-w-[150px] h-[32px] ${s.id === solutionId || (s.id === 5 && solutionId === 6) ? 'text-white' : 'text-[#126363]'} `}
                >
                  {s.title}
                </h4>
                <div
                  id={`solution_${s.id}_content`}
                  className={`md:relative lg:flex-1  max-lg:w-full h-[455px] max-lg:h-[250px] flex flex-col items-center max-lg:items-start justify-around lg:mt-[68px] max-lg:my-0 opacity-0`}
                >
                  <div className=" max-w-[369px]  h-[120px] lg:h-[250px] md:h-[300px] self-center md:absolute lg:static md:top-[-20%] md:right-[20px]">
                    <video
                      className="pointer-events-none h-full"
                      autoPlay
                      loop
                      muted
                      playsInline={true}
                      key={s.title}
                    >
                      <source src={s.video.path} type="video/mp4" />
                    </video>
                  </div>
                  <p className="max-w-[419px] max-lg:max-w-full font-dmSans text-[18px] max-lg:text-[14px] leading-120 font-normal text-[#A2A2A2] lg:px-[10px]">
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
