import React from 'react';
import { icons, paragraphs, solutionSlides } from '../constants';
import { FooterBtn, SocialMedia } from './';

const Footer: React.FC = () => {
  return (
    <footer className="h-[910px] max-w-[100%] basic-pd bg-footer-gradient">
      <div className="grid grid-cols-2 pt-[30px] h-full">
        <div className="h-full">
          <img
            src={icons.white.path}
            alt={icons.white.name}
            className="w-[46px]"
          />
        </div>
        <div className="pr-[53px] h-full">
          <p className="w-[545px] text-[24px] font-light font-dmSans">
            {paragraphs.footer}
          </p>
          <div className="bg-[#000000] bg-opacity-15 rounded-[19.51px]">
            <div className=" grid grid-cols-6 grid-rows-1  my-[64px]  gap-x-[7px] gap-y-[34px]">
              {solutionSlides.map((s, i) => (
                <div
                  className="bg-[#000000] bg-opacity-15 rounded-[19.51px]"
                  key={s.id}
                >
                  <img
                    src={s.image.path}
                    alt={s.title}
                    className="w-[106.12px] h-[105.02px]"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex flex-col w-[132px] h-[171px] gap-[16px]">
              <FooterBtn text="Get in Touch" />
              <FooterBtn text="What We do" />

              <div className="mt-[40px] flex flex-col w-[91px] gap-[15px] font-diatype font-medium leading-100 tracking-m3p">
                <SocialMedia
                  text="Instagram"
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
          <div className="flex flex-col gap-[17px] mt-[180px]  mb-[11px]">
            <div>
              <a
                href=""
                className="text-[12px] font-medium uppercase font-diatype leading-120 tracking-m2p text-[#1D2222]"
              >
                {' '}
                TERMS{' '}
              </a>
            </div>
            <div>
              <a
                href=""
                className="text-[12px] font-medium uppercase font-diatype leading-120 tracking-m2p text-[#1D2222]"
              >
                {' '}
                PRIVACY{' '}
              </a>
            </div>
            <div>
              <a
                href=""
                className="text-[12px] font-medium uppercase font-diatype leading-120 tracking-m2p text-[#1D2222]"
              >
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
