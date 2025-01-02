import React from 'react';

interface FooterBtnProps {
  text: string;
}

const FooterBtn: React.FC<FooterBtnProps> = ({ text }) => {
  return (
    <button className="w-[132px] h-[36px] bg-[#000000] bg-opacity-20 rounded-[24px] text-[14px] font-normal capitalize">
      {' '}
      {text}
    </button>
  );
};

export default FooterBtn;
