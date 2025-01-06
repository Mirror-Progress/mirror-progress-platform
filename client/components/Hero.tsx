import React from 'react';
import { paragraphs, solutionSlides } from '../constants';
import Header from './Header';

const Hero: React.FC = () => {
  return (
    <div className="relative h-screen bg-[#012727] max-w-full">
      <Header />
      <section className="basic-pd h-full absolute top-0 left-0 right-0">
        <div className="h-full flex items-center justify-center">
          <p className="font-dmSans max-w-[650px] h-[138px] text-center font-light text-[46px] tracking-3p leading-100 z-[3]">
            {paragraphs.hero}
          </p>
        </div>
      </section>
      <div className=" h-full flex flex-wrap justify-center items-center gap-[100px] grid-rows-3 absolute z-[1]">
        {solutionSlides.map((s) => (
          <div className="w-[264px] h-[248px] relative">
            <div className="w-[16px] h-[16px] border-[1px] border-[#FFFFFF] border-opacity-30 absolute top-1/2 left-[-8px]"></div>
            <div className="w-[16px] h-[16px] border-[1px] border-[#FFFFFF] border-opacity-30 absolute top-1/2 right-[8px]"></div>
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
    </div>
  );
};

export default Hero;
