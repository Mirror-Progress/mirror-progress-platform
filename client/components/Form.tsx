import { useGSAP } from '@gsap/react';
import React, { MutableRefObject, useRef, useState } from 'react';
import { offices, policyText } from '../constants';
import { Office } from './';
import gsap from 'gsap';

const Form: React.FC = () => {
  /* State and Refs */
  const email = useRef<HTMLInputElement>(null);
  const message = useRef<HTMLInputElement>(null);
  const popup = useRef<HTMLDivElement | null>(null);
  const policyRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const [officeChos, setOfficeChos] = useState(offices[1]);
  const [emailValue, setEmailValue] = useState('');
  const [messageValue, setMessageValue] = useState('');
  const [formData, setFormData] = useState({});

  /* Functionalities  */

  const animatePopup = () => {
    if (popup.current) {
      gsap.fromTo(
        '#popup',
        {
          display: 'hidden',
          top: '100%',
        },
        {
          display: 'flex',
          top: '5%',
          ease: 'power3.inOut',
        }
      );
    }
  };
  
  const hidePopup = () => {
    if (popup.current) {
      gsap.fromTo(
        '#popup',
        {
          display: 'flex',
          top: '0%',
        },
        {
          display: 'none',
          top: '100%',
          ease: 'power3.inOut',
        }
      );
      setEmailValue('');
      setMessageValue('');
    }
  };

  const handleForm = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (emailValue !== '' && messageValue !== '') {
      // setFormData((prev) => ({
      //   ...prev,
      //   mail: emailValue,
      //   message: messageValue,
      //   office: officeChos.text,
      // }));
      animatePopup();
    }
    e.preventDefault();
  };

  const show = (el: MutableRefObject<HTMLDivElement | null>) => {
    if (el.current) el.current.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  useGSAP(() => {
    gsap.to('#waitForm', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      scrollTrigger: {
        trigger: '#Form',
        start: 'bottom 40%',
        toggleActions: 'play none none reverse',
      },
    });
  });

  return (
    <section
      id="Form"
      className="h-[90vh] w-full basic-pd mb-[100px] "
      ref={sectionRef}
    >
      <div className="h-full w-full relative flex justify-center items-center">
        <form action="" className="w-full">
          <h1
            id="waitForm"
            className="opacity-0 translate-y-12 text-center mx-auto text-[40px] font-dmSans mt-[20px] "
          >
            Get in Touch
          </h1>
          <div
            id="waitForm"
            className=" opacity-0 translate-y-12 w-full flex flex-col items-center "
          >
            <input
              ref={email}
              type="email"
              placeholder="Your email"
              name="mail"
              className="input lg:w-[463px] max-lg:w-[50%] max-md:w-[100%] h-[57px] mt-[64px] rounded-[24px]"
              value={emailValue}
              onChange={(ev) => setEmailValue(ev.target.value)}
            />
            <input
              ref={message}
              type="text"
              placeholder="Write your message here..."
              name="mail"
              className="input lg:w-[877px] max-lg:w-[90%] max-md:w-[100%] h-[150px] mt-[12px] rounded-[51px]"
              value={messageValue}
              onChange={(ev) => setMessageValue(ev.target.value)}
            />
          </div>
          <div id="waitForm" className="w-full opacity-0 translate-y-12">
            <div className="uppercase w-full mx-auto text-center text-[14px] font-normal text-white mt-[24px] font-diatype leading-normal tracking-m3p ">
              Choose an office
            </div>
            <div className="lg:w-[846px] max-lg:w-[95%]  max-md:w-[100%]  lg:h-[66px] rounded-[40px] bg-[#284C4C87] mx-auto mt-[24px] flex  max-md:flex-col">
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
              className={`block mx-auto my-[26px] w-[132px] h-[36px]  rounded-[24px] text-[14px] font-normal border-[1px] border-white border-opacity-10 font-inter  max-md:w-full max-md:h-[64px] ${emailValue !== '' && messageValue !== '' ? 'text-primary bg-white ' : 'text-secondaryGrey bg-white bg-opacity-15 max-md:bg-[#616161] max-md:text-[#1D2222]'} `}
              onClick={(e) => handleForm(e)}
            >
              Send
            </button>
            <p className="uppercase max-w-[348px] mx-auto text-center text-[10px] font-normal text-secondaryGrey">
              By providing your email address, you consent to OUR{' '}
              <a
                href="#Form"
                className="text-white  cursor-pointer"
                onClick={() => show(policyRef)}
              >
                PRIVACY POLICY{' '}
              </a>
              AND TO receive communications from MIRROR PROGRESS.
            </p>
          </div>
        </form>

        {/* POPUP */}
        <div
          id="popup"
          ref={popup}
          className="absolute hidden top-[100%] h-[95%] w-[564px] max-md:w-[90%] bg-black bg-opacity-30 mx-auto flex-col items-center justify-center backdrop-blur-lg rounded-[80px] "
        >
          <div className="w-[340px] mb-[84px]">
            <h2 className="font-dmSans text-[80px] max-md:text-[60px] leading-100 tracking-m3p font-light text-center">
              Received
            </h2>
            <p className="font-diatype text-[18px] max-md:text-[16px] leading-120 text-center mt-[64px]">
              Thank you for your message. We’ve received it and will get back to
              you as soon as we can.
            </p>
          </div>
          <div>
            <button
              className={`rounded-[24px] text-[14px] text-white font-normal font-inter leading-140 px-[24px] py-[8px] bg-white bg-opacity-20`}
              onClick={() => hidePopup()}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* POLICY */}
      <div
        ref={policyRef}
        className="w-full basic-pd h-screen hidden justify-center bg-black bg-opacity-20 backdrop-blur-lg fixed top-0 left-0 right-0 bottom-0"
      >
        <div className="w-full overflow-y-scroll scrollbar-hide flex justify-center">
          <div className="md:max-w-[464px] max-md:max-w-[313px]">
            <h2 className="font-dmSans text-[80px] max-md:text-[40px] font-light leading-100 tracking-m2p pt-[180px]">
              {' '}
              Privacy Policy{' '}
            </h2>
            <h3 className="font-diatype text-[14px] leading-120 uppercase mt-[64px] mb-[40px]">
              {' '}
              Effective Date: Januarty 1st 2025
            </h3>
            <div className="pb-[30px]">
              {policyText.map((t) => (
                <div
                  key={t.id}
                  className="font-dmSans text-[17px] max-md:text-[12px] leading-120 font-normal mb-[30px]"
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
        <button
          className={`h-[36px] rounded-[24px] text-[14px] text-white font-normal font-inter leading-140 px-[24px] py-[8px] bg-white bg-opacity-20 absolute md:top-[188px] max-md:top-[40px] md:right-[357px] max-md:right-[40px]`}
          onClick={() => {
            if (policyRef.current) policyRef.current.style.display = '';
            document.body.style.overflow = '';
          }}
        >
          Close
        </button>
      </div>
    </section>
  );
};

export default Form;
