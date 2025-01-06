import React, { useRef } from 'react';
import { termsConditions } from '../constants';

const Terms: React.FC = () => {
  const termsRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <div
        ref={termsRef}
        className="w-full h-screen overflow-y-scroll hidden justify-center bg-black bg-opacity-20 backdrop-blur-lg absolute top-0 left-0"
      >
        <div className="max-w-[464px]">
          <h2 className="font-dmSans text-[80px] font-light leading-100 tracking-m2p pt-[180px] ">
            {' '}
            Terms & Conditions{' '}
          </h2>
          <h3 className="font-diatype text-[14px] leading-120 uppercase mt-[64px] mb-[40px]">
            {' '}
            Effective Date: Januarty 1st 2025
          </h3>
          <div>
            {termsConditions.map((t) => (
              <div
                key={t.id}
                className="font-dmSans text-[17px] leading-120 font-normal mb-[30px]"
              >
                <h4>{t.title}</h4>
                <p>{t.text}</p>
              </div>
            ))}
          </div>
          <div>
            <button
              className={`rounded-[24px] text-[14px] text-[#FFFFFF] font-normal font-inter leading-140 px-[24px] py-[8px] bg-[#FFFFFF] bg-opacity-20 fixed top-[200px] right-[300px]`}
              onClick={() => {
                if (termsRef.current) termsRef.current.style.display = '';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;
