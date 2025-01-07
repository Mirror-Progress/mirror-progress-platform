import React from 'react';
import { heroMP, paragraphs, solutionSlides } from '../constants';
import { Header } from './';

const Hero: React.FC = () => {
  return (
    <div className="relative h-screen bg-primary max-w-full">
      <Header />
      <section className="basic-pd h-full absolute top-0 left-0 right-0">
        <div className="h-full flex items-center justify-center">
          <p className="font-dmSans max-w-[650px] h-[138px] text-center font-light text-[46px] max-md:text-[24px] tracking-3p leading-100 z-[3]">
            {paragraphs.hero}
          </p>
        </div>
      </section>
      <div className=" max-md:hidden h-full flex flex-wrap justify-center items-center gap-[100px] grid-rows-3 absolute z-[1]">
        {solutionSlides.map((s) => (
          <div key={s.id} className="w-[264px] h-[248px] relative">
            <div className="w-[16px] h-[16px] border-[1px] border-white border-opacity-30 absolute top-1/2 left-[-8px]"></div>
            <div className="w-[16px] h-[16px] border-[1px] border-white border-opacity-30 absolute top-1/2 right-[8px]"></div>
            <div className="w-[249px] h-[249px] bg-[#023333] bg-opacity-50 rounded-[69px] flex justify-center items-center">
              <div className="w-[175px] h-[113px]">
                <img src={s.image.path} alt={s.title} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        id="left"
        className="w-[237px] h-full absolute bg-gradient-to-l to-[#1D2222FF] from-[#1D222200]  top-0 left-0 z-0"
      ></div>
      <div
        id="right"
        className="w-[237px] h-full absolute
        bg-gradient-to-l to-[#1D222200] from-[#1D2222FF] top-0 right-0 z-0"
      ></div>
      {/* <div className="h-full w-1/2 absolute top-0 left-0 bg-black z-[4] flex justify-end items-center ">
        <div className="absolute">
          <img src={heroMP.mirror.path} alt={heroMP.mirror.alt} />
        </div>
      </div>
      <div className="h-full w-1/2 absolute top-0 right-0 bg-black z-[4] flex justify-start items-center">
        <div className="absolute pt-[8px]">
          <img src={heroMP.progress.path} alt={heroMP.progress.alt} />
        </div>
      </div> */}
    </div>
  );
};

export default Hero;
