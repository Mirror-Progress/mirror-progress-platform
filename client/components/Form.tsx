import React, { useEffect, useRef, useState } from 'react';
import { offices } from '../constants';
import { Office } from './';

const Form: React.FC = () => {
  /* State and Refs */
  const [officeChos, setOfficeChos] = useState(offices[0]);
  const email = useRef<HTMLInputElement>(null);
  const message = useRef<HTMLInputElement>(null);
  const [emailValue, setEmailValue] = useState('');
  const [messageValue, setMessageValue] = useState('');

  // useEffect(() => {

  // }, [emailValue, messageValue]);

  return (
    <section id="Form" className="h-[90vh]   bg-[#012727]">
      <div className="h-full mb-[100px]">
        <form action="" className="mx-auto w-[878px]">
          <h1 className="max-w-[515px]  text-center mx-auto text-[40px] font-dmSans">
            Get in Touch
          </h1>
          <div>
            <input
              ref={email}
              type="email"
              placeholder="Your email"
              name="mail"
              className="block text-[16px] w-[463px] h-[57px] mx-auto mt-[64px] bg-[#284C4C] bg-opacity-[53] rounded-[24px] text-center font-diatype font-normal tracking-m3p leading-100 placeholder:font-diatype opacity-50"
              value={emailValue}
              onChange={(ev) => setEmailValue(ev.target.value)}
            />
            <input
              ref={message}
              type="text"
              placeholder="Write your message here..."
              name="mail"
              className="block text-[16px] w-[877px] h-[150px] mx-auto mt-[12px] bg-[#284C4C] bg-opacity-[53] rounded-[51px] text-center font-diatype font-normal tracking-m3p leading-100 placeholder:font-diatype opacity-50"
              value={messageValue}
              onChange={(ev) => setMessageValue(ev.target.value)}
            />
          </div>
          <div>
            <div className="uppercase max-w-[348px] mx-auto text-center text-[14px] font-normal text-[#FFFFFF] mt-[24px] font-diatype leading-normal tracking-m3p ">
              Choose an office
            </div>
            <div className="w-[846px] h-[66px] rounded-[40px] bg-[#284C4C87] mx-auto mt-[24px] flex ">
              {offices.map((o) => (
                <Office
                  text={o.text}
                  office={officeChos}
                  key={o.id}
                  onClick={() => setOfficeChos(o)}
                />
              ))}
            </div>
            <button
              className={`block mx-auto my-[26px] w-[132px] h-[36px] bg-[#FFFFFF] bg-opacity-15 rounded-[24px] text-[14px] font-normal border-[1px] border-[#FFFFFF] border-opacity-10 font-inter  ${emailValue !== '' && messageValue !== '' ? 'text-[#FFFFFF]' : 'text-[#A2A2A2]'}  `}
            >
              Send
            </button>
            <p className="uppercase max-w-[348px] mx-auto text-center text-[10px] font-normal text-[#A2A2A2] ">
              By providing your email address, you consent to OUR{' '}
              <span className="text-[#FFFFFF]">PRIVACY POLICY </span>
              AND TO receive communications from MIRROR PROGRESS.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Form;
