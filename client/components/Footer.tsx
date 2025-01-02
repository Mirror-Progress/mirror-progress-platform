import React from 'react';
import { icons, paragraphs, solutionSlides } from '../constants';
import { FooterBtn, SocialMedia } from './';

const Footer: React.FC = () => {
  return (
    <footer className="h-screen max-w-full">
      <div className="grid grid-cols-2 pt-[30px]">
        <div>
          <img
            src={icons.white.path}
            alt={icons.white.name}
            className="w-[46px]"
          />
        </div>
        <div className="pr-[53px]">
          <p className="w-[545px] text-[24px] font-light">
            {paragraphs.footer}
          </p>
          <div>
            <div className=" grid grid-cols-3 grid-rows-2  my-[64px] h-[377px] gap-x-[28px] gap-y-[34px]">
              <div className="bg-[#000000] bg-opacity-15 rounded-[19.51px]">
                <video
                  className="h-full w-full pointer-events-none rounded-[19.51px] "
                  loop
                  autoPlay
                  playsInline={true}
                >
                  <source src={solutionSlides[0].path} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="bg-[#000000] bg-opacity-15 rounded-[19.51px]">
                <video
                  className="h-full w-full pointer-events-none rounded-[19.51px] "
                  loop
                  autoPlay
                  playsInline={true}
                >
                  <source src={solutionSlides[0].path} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="bg-[#000000] bg-opacity-15 rounded-[19.51px]">
                <video
                  className="h-full w-full pointer-events-none rounded-[19.51px] "
                  loop
                  autoPlay
                  playsInline={true}
                >
                  <source src={solutionSlides[0].path} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="bg-[#000000] bg-opacity-15 rounded-[19.51px]">
                <video
                  className="h-full w-full pointer-events-none rounded-[19.51px] "
                  loop
                  autoPlay
                  playsInline={true}
                >
                  <source src={solutionSlides[0].path} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="bg-[#000000] bg-opacity-15 rounded-[19.51px]">
                <video
                  className="h-full w-full pointer-events-none rounded-[19.51px] "
                  loop
                  autoPlay
                  playsInline={true}
                >
                  <source src={solutionSlides[0].path} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="bg-[#000000] bg-opacity-15 rounded-[19.51px]">
                <video
                  className="h-full w-full pointer-events-none rounded-[19.51px] "
                  loop
                  autoPlay
                  playsInline={true}
                >
                  <source src={solutionSlides[0].path} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <div className="flex flex-col w-[132px] h-[171px] gap-[16px]">
              <FooterBtn text="Get in Touch" />
              <FooterBtn text="What We do" />

              <div className="mt-[40px] flex flex-col w-[91px] gap-[15px]">
                <SocialMedia
                  text="Intagram"
                  path={icons.arrow.path}
                  alt={icons.arrow.name}
                />
                <SocialMedia
                  text="Linkedin"
                  path={icons.arrow.path}
                  alt={icons.arrow.name}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-[17px] mt-[200px] mb-[11px]">
            <div>
              <a href="" className="text-[12px] font-medium uppercase">
                {' '}
                TERMS{' '}
              </a>
            </div>
            <div>
              <a href="" className="text-[12px] font-medium uppercase">
                {' '}
                PRIVACY{' '}
              </a>
            </div>
            <div>
              <a href="" className="text-[12px] font-medium uppercase">
                {' '}
                © 2024 Mirror Progress LLC All Rights Reserved{' '}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
