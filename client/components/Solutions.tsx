import React, { useState } from 'react';
import { solutionSlides } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/all';

const Solutions: React.FC = () => {
  const [solutionId, setSolutionId] = useState(0);

  useGSAP(() => {
    CustomEase.create('bezier', '0, 0, 0, 0.99');
    if (solutionId < 6 && window.innerWidth >= 1024) {
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
            gsap.set(`#highlight_line_0`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_0`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onUpdate: () => {
            gsap.set(`#highlight_line_0`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_0`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.to(`#solution_0_content`, {
              opacity: 1,
              duration: 0.5,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.to(`#solution_0_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
              delay: 1,
            });
            gsap.set(`#highlight_line_0`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_0`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
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
            gsap.set(`#highlight_line_1`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_1`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onUpdate: () => {
            gsap.set(`#highlight_line_1`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_1`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.to(`#solution_1_content`, {
              opacity: 1,
              duration: 0.5,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.to(`#solution_1_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
              delay: 1,
            });
            gsap.set(`#highlight_line_1`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_1`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
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
            gsap.set(`#highlight_line_2`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_2`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onUpdate: () => {
            gsap.to(`#solution_2_content`, {
              opacity: 1,
              duration: 0.5,
              ease: 'bezier',
            });
            gsap.set(`#highlight_line_2`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_2`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.to(`#solution_2_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
              delay: 1,
            });
            gsap.set(`#highlight_line_2`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_2`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
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
            gsap.set(`#highlight_line_3`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_3`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onUpdate: () => {
            gsap.to(`#solution_3_content`, {
              opacity: 1,
              duration: 0.5,
              ease: 'bezier',
            });
            gsap.set(`#highlight_line_3`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_3`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.to(`#solution_3_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
              delay: 1,
            });
            gsap.set(`#highlight_line_3`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_3`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
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
            gsap.set(`#highlight_line_4`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_4`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onUpdate: () => {
            gsap.to(`#solution_4_content`, {
              opacity: 1,
              duration: 0.5,
              ease: 'bezier',
            });
            gsap.set(`#highlight_line_4`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_4`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.to(`#solution_4_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
              delay: 1,
            });
            gsap.set(`#highlight_line_4`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_4`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
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
            gsap.set(`#highlight_line_5`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_5`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onUpdate: () => {
            gsap.to(`#solution_5_content`, {
              opacity: 1,
              duration: 0.5,
              ease: 'bezier',
            });
            gsap.set(`#highlight_line_5`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_5`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.set(`#highlight_line_5`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_5`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.to(`#solution_5_content`, {
              opacity: 0,
              duration: 0.5,
              ease: 'bezier',
              delay: 1,
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
        .to(`#solution_0`, {
          top: 0,
          duration: 1,
          onUpdate: () => {
            gsap.set(`#highlight_line_0`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_0`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.set(`#highlight_line_0`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_0`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onReverseComplete: () => {
            gsap.set(`#highlight_line_0`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_0`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
        })
        .to(`#solution_1`, {
          top: `${1 * 8}%`,
          duration: 1,
          delay: 0.2,
          onUpdate: () => {
            gsap.set(`#highlight_line_1`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_1`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.set(`#highlight_line_1`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_1`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onReverseComplete: () => {
            gsap.set(`#highlight_line_1`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_1`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
        })
        .to(`#solution_2`, {
          top: `${2 * 8}%`,
          duration: 1,
          delay: 0.2,
          onUpdate: () => {
            gsap.set(`#highlight_line_2`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_2`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.set(`#highlight_line_2`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_2`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onReverseComplete: () => {
            gsap.set(`#highlight_line_2`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_2`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
        })
        .to(`#solution_3`, {
          top: `${3 * 8}%`,
          duration: 1,
          delay: 0.2,
          onUpdate: () => {
            gsap.set(`#highlight_line_03`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_3`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.set(`#highlight_line_3`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_3`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onReverseComplete: () => {
            gsap.set(`#highlight_line_3`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_3`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
        })
        .to(`#solution_4`, {
          top: `${4 * 8}%`,
          duration: 1,
          delay: 0.2,
          onUpdate: () => {
            gsap.set(`#highlight_line_4`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_4`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.set(`#highlight_line_4`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_4`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onReverseComplete: () => {
            gsap.set(`#highlight_line_4`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_4`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
        })
        .to(`#solution_5`, {
          top: `${5 * 8}%`,
          duration: 1,
          delay: 0.2,
          onUpdate: () => {
            gsap.set(`#highlight_line_5`, {
              backgroundColor: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_5`, {
              color: 'white',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onComplete: () => {
            gsap.set(`#highlight_line_5`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_5`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
          },
          onReverseComplete: () => {
            gsap.set(`#highlight_line_5`, {
              backgroundColor: '#126363',
              duration: 0.1,
              ease: 'bezier',
            });
            gsap.set(`#highlight_title_5`, {
              color: '#126363',
              duration: 0.1,
              ease: 'bezier',
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
                  className={`md:relative  max-lg:w-full max-lg:h-full  flex-1 self-center flex flex-col  max-lg:flex-row-reverse max-sm:flex-col  max-lg:justify-between lg:items-center lg:self-start xl:items-center lg:justify-evenly  lg:w-full  max-md:gap-[8px] max-sm:justify-start  lg:opacity-0 bg-[#012727]`}
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
                  <p className="font-dmSans text-[16px] lg:text-[15px] max-sm:text-[14px] leading-120 font-normal text-white  max-md:text-left max-lg:self-center max-md:self-start lg:px-[30px] md:max-w-[350px] lg:max-w-[440px]  max-sm:w-[350px] max-lg:translate-y-[-30px]  bg-[#012727] ">
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

// If you need to disable SSR in Next.js to avoid DOM mismatch:
// export default dynamic(() => Promise.resolve(Solutions), { ssr: false });
// */
