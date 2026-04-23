import React, { forwardRef } from 'react';

interface OfficeProps {
  text: string;
  office: {
    id: number;
    text: string;
  };
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

const Office = forwardRef<HTMLDivElement, OfficeProps>(
  ({ text, office, onClick }, ref) => {
    return (
      <div
        ref={ref}
        id={`office_${office.id}`}
        className={`lg:max-w-[282px] h-full flex items-center justify-center px-[44px] py-[28px] flex-1 rounded-[40px] cursor-pointer font-dmSans lg:text-[18px] max-lg:text-[15px] text-center ${
          office.text === text
            ? 'text-[color:var(--theme-page-text)] font-normal'
            : 'theme-eyebrow font-light'
        } `}
        onClick={onClick}
      >
        {text}
      </div>
    );
  }
);

export default Office;
