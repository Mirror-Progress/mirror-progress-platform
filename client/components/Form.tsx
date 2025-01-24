import { useGSAP } from '@gsap/react';
import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import { offices, policyText } from '../constants';
import { Office } from './';
import gsap from 'gsap';
import { CustomEase } from 'gsap/all';
gsap.registerPlugin(CustomEase);

const Form: React.FC = () => {
  /* State and Refs */
  const email = useRef<HTMLInputElement>(null);
  const message = useRef<HTMLTextAreaElement>(null);
  const popup = useRef<HTMLDivElement | null>(null);
  const policyRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const buttonForm = useRef<HTMLButtonElement>(null);
  const office0 = useRef<HTMLDivElement | null>(null);
  const office1 = useRef<HTMLDivElement | null>(null);
  const office2 = useRef<HTMLDivElement | null>(null);

  const [officeChos, setOfficeChos] = useState(offices[0]);
  const [emailValue, setEmailValue] = useState('');
  const [messageValue, setMessageValue] = useState('');
  const [dynamicHeight, setDynamicHeight] = useState(152);
  const [dynamicPadding, setDynamicPadding] = useState(60);

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

  const updateOffice = (off: any) => {
    CustomEase.create('bezier', '0, 0, 0, 0.99');
    if (window.innerWidth > 768) {
      gsap.to('#bgOff', {
        left: off.id * 282,
        ease: 'bezier',
        duration: 0.3,
      });
    } else if (window.innerWidth < 768) {
      gsap.to('#bgOff', {
        top: off.id * 80,
        ease: 'bezier',
        duration: 0.3,
      });
    }

    setOfficeChos(off);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (newValue: string) => {
    setEmailValue(newValue);
    if (isValidEmail(newValue) && messageValue !== '') {
      if (buttonForm.current) buttonForm.current.disabled = false;
    } else {
      if (buttonForm.current) buttonForm.current.disabled = true;
    }
  };

  const handleForm = (e: React.FormEvent<HTMLFormElement>) => {
    if (isValidEmail(emailValue) && messageValue !== '') {
      if (sectionRef.current)
        sectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      animatePopup();
    }
    e.preventDefault();
  };

  const show = (el: MutableRefObject<HTMLDivElement | null>) => {
    if (el.current) el.current.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  const handleInput = (
    ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const element = ev.target as HTMLTextAreaElement;
    const contentHeight = element.scrollHeight;
    const minPadding = 40;
    const maxPadding = 60;
    const calculatedPadding = Math.max(
      minPadding,
      maxPadding - (contentHeight - 152) / 5
    );
    setDynamicHeight(contentHeight);
    setDynamicPadding(calculatedPadding);
  };

  useEffect(() => {
    handleEmailChange(emailValue);
  }, [emailValue, messageValue]);

  useGSAP(() => {
    if (window.innerWidth > 768) {
      gsap.to('#waitForm', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        scrollTrigger: {
          trigger: '#Form',
          start: 'top 60%',
          end: 'bottom top',
          toggleActions: 'play none none reverse',
        },
      });
    } else if (window.innerWidth < 768) {
      gsap.to('#waitForm', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        scrollTrigger: {
          trigger: '#Form',
          start: 'top 60%',
          end: 'bottom bottom',
          toggleActions: 'play none none reverse',
        },
      });
    }
  });

  return (
    <section
      id="Form"
      className="h-screen w-full basic-pd lg:mt-[100vh] max-md:mt-[100vh] max-md:mb-0 py-[120px]"
      ref={sectionRef}
    >
      <div className="h-full w-full relative flex justify-center items-center ">
        <form action="" className="w-full " onSubmit={(e) => handleForm(e)}>
          <h1
            id="waitForm"
            className="opacity-0 translate-y-12 text-center mx-auto text-[40px] font-dmSans "
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
              className="input text-center lg:w-[463px] max-lg:w-[50%] max-md:w-[100%] h-[57px] mt-[15px] rounded-[24px] text-white leading-110"
              value={emailValue}
              onChange={(ev) => {
                handleEmailChange(ev.target.value);
              }}
            />
            <p
              className={`font-diatype uppercase text-[12px] text-[#FF9500] leading-100 tracking-m3p py-[12px] ${isValidEmail(emailValue) === false && emailValue !== '' ? 'opacity-1' : 'opacity-0'}`}
            >
              Please enter a valid email address.{' '}
            </p>

            <div
              className={`h-auto max-md:min-h-[152px] lg:w-[877px] max-lg:w-[90%] max-md:w-[100%] relative`}
              style={{ minHeight: dynamicHeight }}
            >
              <textarea
                ref={message}
                placeholder="Write your message here..."
                name="mail"
                className={`input w-full rounded-[24px] text-white ${messageValue === '' ? 'text-center' : ''} font-medium  px-[134px] max-md:px-[30px] resize-none overflow-hidden `}
                style={{
                  height: `${dynamicHeight}px`,
                  paddingTop: `${dynamicPadding}px`,
                  paddingBottom: `${dynamicPadding}px`,
                  overflow: 'hidden',
                }}
                value={messageValue}
                onChange={(ev) => setMessageValue(ev.target.value)}
                onInput={(ev) => {
                  handleInput(ev);
                }}
              />
              <p className="text-[#FFFFFF4D] text-end font-diatype font-normal tracking-m3p leading-normal absolute right-[12px] bottom-[12px]">
                {`${messageValue.length}/500`}
              </p>
            </div>
          </div>
          <div id="waitForm" className="w-full opacity-0 translate-y-12">
            <div className="uppercase w-full mx-auto text-center text-[14px] font-normal text-white my-[16px] font-diatype leading-normal tracking-m3p ">
              Choose an office
            </div>
            <div className="relative lg:w-[846px] max-lg:w-[95%]  max-md:w-[100%]  lg:h-[66px] rounded-[24px] bg-[#284C4C87] mx-auto  flex  max-md:flex-col">
              {offices.map((o) => (
                <Office
                  ref={o.id === 0 ? office0 : o.id === 1 ? office1 : office2}
                  text={o.text}
                  office={officeChos}
                  key={o.id}
                  onClick={() => updateOffice(o)}
                />
              ))}
              <div
                id="bgOff"
                className={`bg-[#FFFFFF0D] absolute z-[-1] lg:w-[282px] lg:h-full  px-[44px] py-[28px] flex-1 rounded-[24px] max-lg:w-full h-1/3 `}
              ></div>
            </div>

            <button
              ref={buttonForm}
              type="submit"
              className={`block mx-auto my-[26px] w-[132px] h-[36px]  rounded-[24px] text-[14px] font-normal border-[1px] border-white border-opacity-10 font-inter  max-md:w-full max-md:h-[64px] ${isValidEmail(emailValue) === true && messageValue !== '' ? 'text-primary bg-white hover:cursor-pointer ' : 'text-secondaryGrey bg-white bg-opacity-15 max-md:bg-[#616161] max-md:text-[#1D2222]'} `}
            >
              Send
            </button>
            <p className="uppercase lg:max-w-[365px] max-md:max-w-[355px] mx-auto text-center text-[10px] font-medium text-secondaryGrey font-diatype tracking-m3p leading-100">
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
          className="absolute hidden top-[100%] h-[90%] w-[564px] max-md:w-[90%] bg-black bg-opacity-30 mx-auto flex-col items-center justify-center backdrop-blur-lg rounded-[80px] "
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
          className={`h-[36px] rounded-[24px] text-[14px] text-white font-normal font-inter leading-140 px-[24px] py-[8px] bg-white bg-opacity-20 absolute md:top-[188px] max-md:top-[40px] md:right-[22%] max-md:right-[40px]`}
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
