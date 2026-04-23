import React from 'react';

interface FooterBtnProps {
  text: string;
  href: string;
}

const FooterBtn: React.FC<FooterBtnProps> = ({ text, href }) => {
  return (
    <a
      href={href}
      className="theme-secondary-button inline-flex min-h-[40px] min-w-[156px] items-center justify-center rounded-[24px] px-[20px] py-[9px] text-center font-inter text-[14px] font-normal capitalize leading-none whitespace-nowrap cursor-pointer"
    >
      {text}
    </a>
  );
};

export default FooterBtn;
