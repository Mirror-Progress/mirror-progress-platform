import React from 'react';
import { paragraphs } from '../constants';

const Process: React.FC = () => {
  return (
    <section className="py-[128px] basic-pd bg-[#126363] ">
      <div className="h-screen flex flex-col justify-around items-center gap-[120px]">
        <div className="h-[377px] w-[377px] rounded-full border-solid border-[2px]"></div>
        <p className="max-w-[690px] text-[32px] font-light text-center font-dmSans">
          {paragraphs.process}
        </p>
      </div>
    </section>
  );
};

export default Process;
