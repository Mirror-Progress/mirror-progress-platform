import React, {
  MutableRefObject,
  SyntheticEvent,
  useRef,
  useState,
} from 'react';
import {
  icons,
  paragraphs,
  policyText,
  solutionSlides,
  termsConditions,
} from '../constants';
import { FooterBtn, SocialMedia } from './';
import { Metadata } from 'next';
import { useGSAP } from '@gsap/react';
import { gsapAnimate } from '../utils/animations';

const Footer: React.FC = () => {
  const termsRef = useRef<HTMLDivElement | null>(null);
  const policyRef = useRef<HTMLDivElement | null>(null);
  const [loadedMetaData, setLoadedMetaData] = useState<
    (Metadata | SyntheticEvent<HTMLVideoElement, Event>)[]
  >([]);

  /* Functionalities  */
  const show = (el: MutableRefObject<HTMLDivElement | null>) => {
    if (el.current) el.current.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  const hide = (el: MutableRefObject<HTMLDivElement | null>) => {
    if (el.current) el.current.style.display = '';
    document.body.style.overflow = '';
  };

  const handleLoadedData = (
    e: React.SyntheticEvent<HTMLVideoElement, Event> | Metadata
  ) => {
    setLoadedMetaData((c) => [...c, e]);
  };

  useGSAP(() => {
      gsapAnimate(
        '#form',
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: .2,
        },
        {
          toggleActions: 'restart reverse none reverse',
        }
      );
    }, []);

  return (
    <footer
      id="Footer"
      className="h-screen max-w-[100%] basic-pd bg-footer-gradient pt-[20px] pb-[10px] relative"
    >
      <div className="grid grid-cols-2 max-md:grid-cols-5 h-full">
        <div className="h-full max-md:col-span-1">
          <img
            src={icons.white.path}
            alt={icons.white.name}
            className="w-[46px]"
          />
        </div>
        <div className="lg:pr-[53px] h-full flex flex-col justify-between max-md:col-span-4 max-md:col-start-3">
          <p className="max-w-[545px]  text-[24px] max-md:text-[16px] font-light font-dmSans">
            {paragraphs.footer}
          </p>
          <div className="bg-black bg-opacity-15 rounded-[19.51px] my-[15px] max-md:hidden">
            <div className=" grid grid-cols-6 grid-rows-1  gap-x-[7px] ">
              {solutionSlides.map((s, i) => (
                <div
                  className="bg-black bg-opacity-15 rounded-[19.51px]"
                  key={s.id}
                >
                  <video
                    className="pointer-events-none w-full h-full"
                    autoPlay
                    loop
                    muted
                    playsInline={true}
                    key={s.title}
                    onLoadedMetadata={(e) => handleLoadedData(e)}
                  >
                    <source src={s.video.path} type="video/mp4" />
                  </video>
                </div>
              ))}
            </div>
          </div>
          <div className="max-md:flex-1 max-md:pt-[70px]">
            <div className="flex flex-col w-[132px] h-[171px] gap-[8px] max-md:gap-[24px]">
              <FooterBtn text="Get in Touch" href="#Form" />
              <FooterBtn text="What We do" href="#Solutions" />

              <div className="flex flex-col gap-[15px] max-md:gap-[24px] font-diatype font-medium leading-100 tracking-m3p mt-[20px] max-md:pt-[70px]">
                <SocialMedia
                  text="Instagram"
                  path={icons.arrow.path}
                  alt={icons.arrow.name}
                  href="nothing yet "
                />
                <SocialMedia
                  text="Linkedin"
                  path={icons.arrow.path}
                  alt={icons.arrow.name}
                  href="nothing yet "
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-[5px] max-md:gap-[24px] max-md:pb-[50px] max-md:max-w-[175px]">
            <div>
              <a
                href="#Footer"
                className="text-[12px] font-medium uppercase font-diatype leading-120 tracking-m2p text-secondaryBlack cursor-pointer"
                onClick={() => {
                  show(termsRef);
                }}
              >
                {' '}
                TERMS{' '}
              </a>
            </div>
            <div>
              <a
                className="text-[12px] font-medium uppercase font-diatype leading-120 tracking-m2p text-[#1D2222] "
                onClick={() => show(policyRef)}
              >
                {' '}
                PRIVACY{' '}
              </a>
            </div>
            <div>
              <a
                href="#Footer"
                className="text-[12px] font-medium uppercase font-diatype leading-120 tracking-m2p text-secondaryBlack ]"
              >
                {' '}
                © 2024 Mirror Progress LLC All Rights Reserved{' '}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* TERMS MODAL*/}
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
              className={`rounded-[24px] text-[14px] text-white font-normal font-inter leading-140 px-[24px] py-[8px] bg-white bg-opacity-20 fixed top-[200px] right-[300px]`}
              onClick={() => hide(termsRef)}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* POLICY MODAL */}

      <div
        ref={policyRef}
        className="w-full h-screen overflow-y-scroll hidden justify-center bg-black bg-opacity-20 backdrop-blur-lg absolute top-0 left-0 "
      >
        <div className="max-w-[464px]">
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
          <div>
            <button
              className={`rounded-[24px] text-[14px] text-white font-normal font-inter leading-140 px-[24px] py-[8px] bg-white bg-opacity-20 fixed top-[200px] right-[300px] `}
              onClick={() => hide(policyRef)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
