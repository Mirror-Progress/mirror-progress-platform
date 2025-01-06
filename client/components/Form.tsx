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

  const popup = useRef<HTMLDivElement | null>(null);

  /* Functionalities  */
  const handleForm = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (popup.current && emailValue !== '' && messageValue !== '')
      popup.current.style.display = 'flex';
  };

  // useEffect(() => {

  // }, [emailValue, messageValue]);

  return (
    <section id="Form" className="h-[90vh] basic-pd bg-[#012727] mb-[100px]">
      <div className="h-full relative flex justify-center items-center ">
        <form action="" className="mx-auto w-[878px]">
          <h1 className="max-w-[515px]  text-center mx-auto text-[40px] font-dmSans mt-[20px]">
            Get in Touch
          </h1>
          <div>
            <input
              ref={email}
              type="email"
              placeholder="Your email"
              name="mail"
              className="block text-[16px] max-w-[463px] h-[57px] mx-auto mt-[64px] bg-[#284C4C] bg-opacity-[53] rounded-[24px] text-center font-diatype font-normal tracking-m3p leading-100 placeholder:font-diatype opacity-50"
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
              className={`block mx-auto my-[26px] w-[132px] h-[36px]  rounded-[24px] text-[14px] font-normal border-[1px] border-[#FFFFFF] border-opacity-10 font-inter  ${emailValue !== '' && messageValue !== '' ? 'text-[#012727] bg-[#FFFFFF] ' : 'text-[#A2A2A2] bg-[#FFFFFF] bg-opacity-15'}  `}
              onClick={(e) => handleForm(e)}
            >
              Send
            </button>
            <p className="uppercase max-w-[348px] mx-auto text-center text-[10px] font-normal text-[#A2A2A2] ">
              By providing your email address, you consent to OUR{' '}
              <a className="text-[#FFFFFF]  cursor-pointer">PRIVACY POLICY </a>
              AND TO receive communications from MIRROR PROGRESS.
            </p>
          </div>
        </form>
        <div
          ref={popup}
          className="h-[95%] w-[564px] absolute bg-[#000000] bg-opacity-30 mx-auto top-[15%] flex-col items-center justify-center rounded-[0px] backdrop-blur-lg hidden"
        >
          <div className="w-[340px] mb-[84px]">
            <h3 className="font-dmSans text-[80px] leading-100 tracking-m3p font-light text-center">
              Received
            </h3>
            <p className="font-diatype text-[18px] leading-120 text-center mt-[64px]">
              Thank you for your message. We’ve received it and will get back to
              you as soon as we can.
            </p>
          </div>
          <div>
            <button
              className={`rounded-[24px] text-[14px] text-[#FFFFFF] font-normal font-inter leading-140 px-[24px] py-[8px] bg-[#FFFFFF] bg-opacity-20`}
              onClick={() => {
                if (popup.current) popup.current.style.display = '';
              }}
            >
              Close
            </button>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default Form;
