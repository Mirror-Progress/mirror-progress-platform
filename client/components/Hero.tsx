import React from 'react';
import { paragraphs } from '../constants';

const Hero: React.FC = () => {
  return (
    <section className="basic-pd h-[calc(100vh-80px)]">
      <div className="h-full flex items-center justify-center text-[32px] font-light">
        <p className="max-w-[450px] text-center">{paragraphs.hero}</p>
      </div>
    </section>
  );
};

export default Hero;
