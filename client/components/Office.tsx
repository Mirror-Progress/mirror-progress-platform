import React from 'react';

interface OfficeProps {
  text: string;
  office: {
    id: number;
    text: string;
  };
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

const Office: React.FC<OfficeProps> = ({ text, office, onClick }) => {
  return (
    <div
      className={`lg:max-w-[282px] h-full  flex items-center justify-center px-[40px] py-[28px] flex-1 rounded-[40px] cursor-pointer font-dmSans  ${office.text === text ? 'bg-[#FFFFFF0D] text-[#FFFFFF] font-normal' : 'bg-transparent text-[#A2A2A2] font-light'} lg:text-[18px] max-lg:text-[15px] text-center px-[44px]`}
      onClick={onClick}
    >
      {text}
    </div>
  );
};

export default Office;
