import React from 'react';
import { icons } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const Header: React.FC = () => {
  useGSAP(() => {
    gsap.to('#header', {
      opacity: 1,
      delay: 4.75,
      duration: 0.5,
    });
  }, []);
  return (
    <header
      id="header"
      className="flex justify-between items-center h-[84px] max-w-full basic-pd absolute top-0 left-0 right-0 z-[2] opacity-0"
    >
      <a href="/">
        <img
          src={icons.white.path}
          alt={icons.white.name}
          className="h-[26.93px] max-md:h-[22.4px] w-[28.85px] max-md:w-[24px]"
        />
      </a>
      <nav className="flex items-center gap-[32px]">
        <div>
          <a href="#Solutions" className="font-dmSans max-md:hidden">
            {' '}
            What We do{' '}
          </a>
        </div>
        <a
          href="#Form"
          className="inline-block text-center px-[24px] py-[8px] bg-[#000000] bg-opacity-20 rounded-[24px] text-[14px] font-normal capitalize border-[1px] border-[#FFFFFF] border-opacity-20 font-inter "
        >
          {' '}
          Get In Touch
        </a>
      </nav>
    </header>
  );
};

export default Header;
