import React from 'react';
import { icons } from '../constants';
import FooterBtn from './FooterBtn';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center h-[84px] max-w-full basic-pd">
      <a href="/">
        <img
          className="h-[28px]"
          src={icons.white.path}
          alt={icons.white.name}
        />
      </a>
      <nav className="flex items-center gap-[32px]">
        <div>
          <a href="#Solutions font-dmSans"> What We do </a>
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
