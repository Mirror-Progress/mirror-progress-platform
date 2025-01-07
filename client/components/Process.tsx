import React from 'react';
import { paragraphs } from '../constants';
import { LottieAnimation } from './';

const Process: React.FC = () => {
  return (
    <section className="pt-[50px] pb-[50px] basic-pd bg-[#0B3839] shadow-process-inset ">
      <div className="h-screen flex flex-col justify-center items-center gap-[80px]">
        <div className="lg:h-[600px] lg:w-[600px] max-md:w-[90%] flex justify-center items-center ">
          <LottieAnimation
            src="https://lottie.host/8f32ce3c-628c-44fa-b860-8c6bb1afec27/3ado51lgMu.lottie"
            loop={true}
            autoplay={true}
          />
        </div>
        <p className="max-w-[900px] text-[32px] font-light text-center font-dmSans">
          {paragraphs.process[2]}
        </p>
      </div>
    </section>
  );
};

export default Process;
