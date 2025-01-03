import React from 'react';

interface FooterBtnProps {
  text: string;
}

const FooterBtn: React.FC<FooterBtnProps> = ({ text }) => {
  return (
    <a className=" block text-center py-[8px] px-[24px] w-[132px] h-[36px] bg-[#000000] bg-opacity-20 rounded-[24px] text-[14px] font-normal capitalize cursor-pointer font-inter">
      {' '}
      {text}
    </a>
  );
};

export default FooterBtn;
