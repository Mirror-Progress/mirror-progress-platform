import React, { useRef } from 'react';
import { icons } from '../constants';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
gsap.registerPlugin(ScrollTrigger);

const Header: React.FC = () => {
  /* State and Refs */
  const linkSolRef = useRef<HTMLAnchorElement>(null);
  const linkFormRef = useRef<HTMLAnchorElement>(null);

  /* Functionnality */
  // const navigateTo = (e:React.MouseEvent<HTMLElement>, section: string) => {
  //   switch (section) {
  //     case 'form':
  //       ScrollTrigger.getAll().forEach((trigger) => trigger.disable());
  //       e.target.href = "#Form"
  //       break;
  //   }
  // };

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
          <a
            ref={linkSolRef}
            className="hover-effect font-dmSans max-md:hidden hover:cursor-pointer"
            href="#Solutions"
          >
            {' '}
            What We do{' '}
          </a>
        </div>
        <a
          ref={linkFormRef}
          className="hover-effect-get-in-touch inline-block hover:cursor-pointer text-center px-[24px] py-[8px] bg-[#000000] bg-opacity-20 rounded-[24px] text-[14px] font-normal capitalize border-[1px] border-[#FFFFFF] border-opacity-20 font-inter "
          href="#Form"
        >
          {' '}
          Get In Touch
        </a>
      </nav>
    </header>
  );
};

export default Header;
