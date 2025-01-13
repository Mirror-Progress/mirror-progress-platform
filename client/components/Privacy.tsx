import React from 'react';
import { policyText } from '../constants';

const Privacy: React.FC = () => {
  return (
    <>
      <div className="w-full h-screen overflow-y-scroll flex justify-center bg-[#000000] bg-opacity-20 backdrop-blur-lg">
        <div className="max-w-[464px] ">
          <h2 className="font-dmSans text-[80px] font-light leading-100 tracking-m2p pt-[180px]">
            {' '}
            Privacy Policy{' '}
          </h2>
          <h3 className="font-diatype text-[14px] leading-120 uppercase mt-[64px] mb-[40px]">
            {' '}
            Effective Date: Januarty 1st 2025
          </h3>
          <div>
            {policyText.map((t) => (
              <div
                key={t.id}
                className="font-dmSans text-[17px] leading-120 font-normal mb-[30px]"
              >
                <h4>{t.title}</h4>
                <p>{t.text}</p>
                <ul className=" pl-[35px]">
                  {t.items.map((i) => (
                    <li key={i.id} className="list-disc">
                      {i.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
