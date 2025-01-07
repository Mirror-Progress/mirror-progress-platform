import React from 'react';
import { solutionSlides } from '../constants';

const Solutions: React.FC = () => {
  return (
    <section id="Solutions" className="h-screen w-full basic-pd  my-[60px]">
      <div className="h-full w-full flex flex-col justify-around">
        <h2 className="uppercase my-[20px] font-diatype font-normal text-[24px]">
          [ Solutions ]
        </h2>
        <div className="min-h-[90%] w-full flex lg:flex-row md:flex-col  max-lg:flex-col overflow-hidden ">
          {solutionSlides.map((s) => (
            <div
              className="flex flex-1 max-md:flex-grow-0 max-md:h-[450px] max-md:flex-col"
              key={s.id}
            >
              <div className="lg:w-[1px]  max-md:w-full max-md:h-[10px] bg-white"></div>
              <div className={`${s.id !== 0 ? 'w-[164px]' : ''}`}>
                <h4
                  className={`font-diatype uppercase pl-[12px] leading-100 font-regular max-w-[150px] h-[32px] ${s.id !== 0 ? 'text-[#126363]' : ''}`}
                >
                  {s.title}
                </h4>
                <div
                  className={`w-[485px] h-[455px] flex flex-col items-center justify-around my-[30px] ${s.id !== 0 ? 'opacity-0' : ''}`}
                >
                  <div className="max-w-[369px] h-[209px] ">
                    <video
                      className="pointer-events-none w-full h-full"
                      autoPlay
                      loop
                      muted
                      playsInline={true}
                      key={s.title}
                    >
                      <source src={s.video.path} type="video/mp4" />
                    </video>
                  </div>
                  <p className="max-w-[419px] font-dmSans text-[18px] leading-120 font-normal text-[#A2A2A2]">
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
