import React from 'react';
import { icons } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center h-[84px] max-w-full basic-pd absolute top-0 left-0 right-0 z-[2]">
      <a href="/">
        <img
          src={icons.white.path}
          alt={icons.white.name}
          width={28.85}
          height={26.93}
          className='max-md:hidden'
        />
        <div className='hidden max-md:flex font-dmSans text-[18px] leading-100 tracking-m6p font-medium'>Mirror Progress</div>
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
