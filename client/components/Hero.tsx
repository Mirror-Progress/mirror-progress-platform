import React from 'react';
import { paragraphs } from '../constants';
import Header from './Header';

const Hero: React.FC = () => {
  return (
    <div className="relative h-screen bg-[#012727] ">
      <Header />
      <section className="basic-pd h-full absolute top-0 left-0 right-0">
        <div className="h-full flex items-center justify-center">
          <p className="font-dmSans max-w-[650px] h-[138px] text-center font-light text-[46px] tracking-3p leading-100">
            {paragraphs.hero}
          </p>
        </div>
      </section>
      <div
        id="left"
        className="w-[237px] h-full absolute bg-gradient-to-l to-[#1D2222FF] from-[#1D222200]  top-0 left-0"
      ></div>
      <div
        id="right"
        className="w-[237px] h-full absolute
        bg-gradient-to-l to-[#1D222200] from-[#1D2222FF] top-0 right-0"
      ></div>
    </div>
  );
};

export default Hero;
