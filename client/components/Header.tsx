import React from 'react';
import { icons } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import AccountMenu from './AccountMenu';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';

gsap.registerPlugin(ScrollTrigger);

const Header: React.FC = () => {
  const { theme } = useTheme();

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
          src={theme === 'light' ? icons.black.path : icons.white.path}
          alt={theme === 'light' ? icons.black.name : icons.white.name}
          className="h-[26.93px] max-md:h-[22.4px] w-[28.85px] max-md:w-[24px]"
        />
      </a>
      <nav className="flex items-center gap-[14px] max-md:gap-[10px]">
        <div>
          <a
            className="hover-effect theme-link font-dmSans max-md:hidden hover:cursor-pointer"
            href="#capabilities"
          >
            {' '}
            What We do{' '}
          </a>
        </div>
        <ThemeToggle className="max-md:hidden" />
        <AccountMenu className="max-md:order-2" />
        <a
          className="theme-secondary-button hover-effect-get-in-touch inline-block hover:cursor-pointer rounded-[24px] px-[24px] py-[8px] text-center font-inter text-[14px] font-normal capitalize"
          href="#contact"
        >
          {' '}
          Get In Touch
        </a>
      </nav>
    </header>
  );
};

export default Header;
