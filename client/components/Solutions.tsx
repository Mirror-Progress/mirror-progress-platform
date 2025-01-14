import React, { useState } from 'react';
import { solutionSlides } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const Solutions: React.FC = () => {
  const [solutionId, setSolutionId] = useState(0);

  useGSAP(() => {
    if (solutionId < 6 && window.innerWidth > 768) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: `#solution_${solutionId}`,
          start: 'top 25%',
          end: 'bottom 80%',
          toggleActions: 'play none none none',
        },
      });
      tl.to(`#solution_${solutionId}`, {
        zIndex: solutionId,
        width: 370,
        left: solutionId * 185,
        duration: 0.9,
        delay: 0.5,
      }).to(`#solution_${solutionId}_content`, {
        opacity: 1,
        duration: 0.5,
        onStart: () => {
          gsap.to(`#solution_${solutionId >= 1 && solutionId - 1}_content`, {
            opacity: 0,
            duration: 0.01,
          });
        },
        onComplete: () => {
          setSolutionId((prev) => prev + 1);
        },
      });
    } else if (solutionId < 6 && window.innerWidth <= 768) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: `#solution_${solutionId}`,
          start: 'top 80%',
          end: 'bottom 10%',
          toggleActions: 'play none none none ',
        },
      });
      tl.to(`#solution_${solutionId}`, {
        zIndex: solutionId,
        height: 350,
        top: solutionId * 75,
        duration: 0.9,
        delay: 0.5,
      }).to(`#solution_${solutionId}_content`, {
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
      className="h-screen max-w-full basic-pd  my-[20px] max-md:my-0 max-md:mt-[10px] "
    >
      <div className="h-full w-full flex flex-col justify-around">
        <h2 className="uppercase max-md:my-0 max-md:mb-[30px]  font-diatype font-normal text-[24px]">
          [ Solutions ]
        </h2>
        <div
          id="solution_container"
          className="min-h-[80%] max-w-full flex flex-row max-lg:flex max-lg:flex-col my-[20px] lg:relative max-lg:relative"
        >
          {solutionSlides.map((s) => (
            <div
              id={`solution_${s.id}`}
              className={`flex lg:w-[185px] bg-[#012727] max-lg:h-[300px] max-lg:w-full  max-lg:flex-col absolute ${s.id === 0 ? 'lg:left-[185px] max-lg:left-0 max-lg:top-[225px]' : ''} ${s.id === 1 ? 'lg:left-[370px]  max-lg:left-0 max-lg:top-[300px]' : s.id === 2 ? ' lg:left-[555px] max-lg:left-0 max-lg:top-[375px]' : s.id === 3 ? ' lg:left-[740px] max-lg:left-0 max-lg:top-[450px]' : s.id === 4 ? ' lg:left-[925px] max-lg:left-0 max-lg:top-[525px]' : s.id === 5 ? ' lg:left-[1110px] max-lg:left-0 max-lg:top-[600px]' : ''} `}
              /*  */
              key={s.id}
            >
              <div
                className={`lg:w-[1px] max-lg:w-full max-lg:h-[1px]  ${s.id !== solutionId && s.id !== solutionId + 1 ? 'bg-[#126363]' : 'bg-white'} ${s.id === 5 && solutionId === 6 ? 'bg-white' : ''} `}
              ></div>
              <div
                className={`${s.id === solutionId ? 'max-lg:h-[60px]' : 'max-lg:h-[361px]'} max-lg:flex max-lg:flex-col ax-lg:justify-around max-lg:mt-[10px] `}
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
                  <p className="max-w-[419px] max-lg:max-w-[299px] font-dmSans text-[18px] max-lg:text-[14px] leading-120 font-normal text-[#A2A2A2] lg:px-[20px]">
                    {solutionSlides[0].text}
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
