import React from 'react';

interface FooterBtnProps {
  text: string;
  href: string;
}

const FooterBtn: React.FC<FooterBtnProps> = ({ text, href }) => {
  return (
    <a
      href={href}
      className=" block text-center py-[8px] px-[24px] w-[132px] h-[36px] bg-[#000000] bg-opacity-20 rounded-[24px] text-[14px] font-normal capitalize cursor-pointer font-inter hover:text-primary hover:bg-white"
    >
      {' '}
      {text}
    </a>
  );
};

export default FooterBtn;
