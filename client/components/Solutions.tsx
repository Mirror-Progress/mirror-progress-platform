import React from 'react';
import { solutionSlides } from '../constants';

const Solutions: React.FC = () => {
  return (
    <section id="Solutions" className="h-screen basic-pd  my-[60px]">
      <div className="h-full flex flex-col justify-around">
        <div className="uppercase my-[20px] font-diatype font-normal text-[24px]">
          [ Solutions ]
        </div>
        <div className="min-h-[90%] flex overflow-hidden ">
          {solutionSlides.map((s) => (
            <div className="flex">
              <div className="w-[1px]  bg-white"></div>
              <div className={`${s.id !== 0 ? 'w-[164px]' : ''}`}>
                <h2
                  className={`font-diatype uppercase pl-[12px] leading-100 font-regular max-w-[150px] h-[32px] ${s.id !== 0 ? 'text-[#126363]' : ''}`}
                >
                  {s.title}
                </h2>
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
