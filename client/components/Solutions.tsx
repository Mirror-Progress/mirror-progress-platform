import React from 'react';
import { solutionSlides } from '../constants';

const Solutions: React.FC = () => {
  return (
    <section
      id="Solutions"
      className="h-screen w-full basic-pd  my-[20px] max-md:my-0 max-md:mt-[10px] "
    >
      <div className="h-full w-full flex flex-col justify-around">
        <h2 className="uppercase max-md:my-0 max-md:mb-[30px]  font-diatype font-normal text-[24px]">
          [ Solutions ]
        </h2>
        <div className="min-h-[80%] w-full flex flex-row   max-lg:flex-col overflow-hidden my-[20px] relative">
          {solutionSlides.map((s) => (
            <div
              className={`flex bg-[#012727]  flex-1 max-lg:h-[450px]  max-lg:flex-col ${s.id === 1 ? 'translate-x-[-300px]' : ''}`}
              key={s.id}
            >
              <div
                className={`lg:w-[1px] max-lg:w-full max-lg:h-[1px]  ${s.id !== 0 && s.id !== 1 ? 'bg-[#126363]' : 'bg-white'}`}
              ></div>
              <div
                className={`${s.id !== 0 ? 'w-[164px] max-lg:h-[60px] mt-[15px] ' : ' max-lg:h-[361px] '} max-lg:flex max-lg:flex-col max-lg:justify-around `}
              >
                <h4
                  className={`font-diatype uppercase pl-[12px] leading-100 font-normal max-w-[150px] h-[32px] ${s.id !== 0 ? 'text-[#126363]' : 'text-white'} `}
                >
                  {s.title}
                </h4>
                <div
                  className={`md:relative lg:flex-1 w-[485px] max-lg:w-full h-[455px] max-lg:h-[250px] flex flex-col items-center max-lg:items-start justify-around lg:mt-[68px] max-lg:my-0  ${s.id !== 0 ? 'opacity-0' : ''}`}
                >
                  <div className=" max-w-[369px]  h-[120px] lg:h-[250px] md:h-[300px] self-center md:absolute lg:static md:top-[-20%] md:right-[20px] ">
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
                  <p className="max-w-[419px] max-lg:max-w-[299px] font-dmSans text-[18px] max-lg:text-[14px] leading-120 font-normal text-[#A2A2A2]">
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
