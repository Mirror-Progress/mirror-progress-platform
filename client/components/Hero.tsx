import React from 'react';
import { heroMP, paragraphs, solutionSlides } from '../constants';
import { Header } from './';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Hero: React.FC = () => {
  useGSAP(() => {
    const tlLeft = gsap.timeline();
    const tlRight = gsap.timeline();
    const tl = gsap.timeline();
    tlLeft
      .to('#leftImg', {
        top: '50%',
        duration: 1,
      })
      .to('#leftImg', {
        left: '-100%',
        duration: 0.5,
        delay: 0.5,
      })
      .to('#left', {
        left: '-100%',
        duration: 0.5,
      });
    tlRight
      .to('#rightImg', {
        top: '50%',
        duration: 1,
      })
      .to('#rightImg', {
        right: '-100%',
        duration: 0.5,
        delay: 0.5,
      })
      .to('#right', {
        right: '-100%',
        duration: 0.5,
      });

    tl.from('#solution', {
      position: 'absolute',
      duration: 0.15,
      delay: 2.3,
    }).to('#wait', {
      opacity: 1,
      delay: 0.3,
      duration: 0.5,
    });
  }, []);

  return (
    <div className="relative h-screen bg-primary max-w-full overflow-hidden">
      <Header />
      <section className="basic-pd h-full absolute top-0 left-0 right-0">
        <div className="h-full flex items-center justify-center">
          <p className="font-dmSans max-w-[650px] h-[138px] text-center font-light text-[46px] max-md:text-[24px] tracking-3p leading-100 z-[3]">
            {paragraphs.hero}
          </p>
        </div>
      </section>
      <div className=" w-full h-full absolute z-[1] flex items-center justify-center gap-[200px] max-md:gap-[50px] flex-wrap ">
        {solutionSlides.map((s) => (
          <div
            id="solution"
            key={s.id}
            className="w-[264px] h-[248px] relative max-md:w-[124.95px] max-md:h-[117.45px]"
          >
            <div
              id="wait"
              className="w-[16px] h-[16px] border-[1px] border-white border-opacity-30 absolute top-1/2 left-[-8px] opacity-0 max-md:hidden"
            ></div>
            <div
              id="wait"
              className="w-[16px] h-[16px] border-[1px] border-white border-opacity-30 absolute top-1/2 right-[8px] opacity-0 max-md:hidden"
            ></div>
            <div className="w-[249px] h-[249px] max-md:w-[117.4px] max-md:h-[117.45px] bg-[#023333] bg-opacity-50 rounded-[69px] max-md:rounded-[24px] flex justify-center items-center ">
              <div
                id="wait"
                className="w-[175px] h-[113px] max-md:w-[75.92px] max-md:h-[69.08px] opacity-0 flex items-center"
              >
                <img src={s.image.path} alt={s.title} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="w-[237px] h-full absolute bg-gradient-to-l to-[#1D2222FF] from-[#1D222200]  top-0 left-0 z-0 max-md:w-full max-md:h-[533px] max-md:right-0 max-md:bg-gradient-to-t"></div>
      <div
        className="w-[237px] h-full absolute
        bg-gradient-to-l to-[#1D222200] from-[#1D2222FF] top-0 right-0 z-0 max-md:hidden"
      ></div>
      <div
        id="left"
        className="h-full w-1/2 absolute top-0 left-0 bg-[#1D2222] z-[4]"
      >
        <div
          id="leftImg"
          className="absolute w-full top-[100%] flex justify-end"
        >
          <img src={heroMP.mirror.path} alt={heroMP.mirror.alt} />
        </div>
      </div>
      <div
        id="right"
        className="h-full w-1/2 absolute top-0 right-0 bg-[#1D2222] z-[4]"
      >
        <div id="rightImg" className="absolute w-full top-[100%]">
          <img src={heroMP.progress.path} alt={heroMP.progress.alt} />
        </div>
      </div>
    </div>
  );
};

export default Hero;
