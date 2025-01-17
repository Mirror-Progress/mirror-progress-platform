import React, { useEffect } from 'react';
import { heroMP, paragraphs, solutionSlides } from '../constants';
import { Header } from './';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Hero: React.FC = () => {
  useGSAP(() => {
    if (window.innerWidth > 768) {
      gsap
        .timeline()
        .to('#leftImg', {
          top: '50%',
          duration: 1,
        })
        .to('#leftImg', {
          left: '-100%',
          duration: 0.5,
        })
        .to('#left', {
          left: '-100%',
          duration: 0.25,
        });
      gsap
        .timeline()
        .to('#rightImg', {
          top: '50%',
          duration: 1,
        })
        .to('#rightImg', {
          right: '-100%',
          duration: 0.5,
        })
        .to('#right', {
          right: '-100%',
          duration: 0.25,
        });
    } else {
      gsap
        .timeline()
        .to('#leftImg', {
          top: '50%',
          duration: 1,
        })
        .to('#leftImg', {
          opacity: 0,
          duration: 0.5,
        })
        .to('#left', {
          top: '-100%',
          duration: 0.25,
        });
      gsap
        .timeline()
        .to('#rightImg', {
          top: '50%',
          duration: 1,
        })
        .to('#rightImg', {
          opacity: 0,
          duration: 0.5,
        })
        .to('#right', {
          top: '-100%',
          duration: 0.25,
        });
    }

    gsap
      .timeline()
      .from('#solution', {
        top: '50%',
        left: '50%',
        xPercent: -50,
        yPercent: -50,
        duration: 1.5,
        delay: 1.5,
        ease: 'power2.inOut',
      })
      .to('#wait', {
        opacity: 1,
        duration: 1,
        delay: 0.75,
      });
    const random = (min: number, max: number) =>
      Math.random() * (max - min) + min;
    gsap
      .timeline({ repeat: -1, yoyo: true })
      .to('#solution', {
        x: random(-20, 20),
        y: random(-20, 20),
        delay: 3,
        duration: 3,
      })
      .to('#solution', {
        x: random(-15, 15),
        y: random(-20, 20),
        delay: 3,
        duration: 3,
      })
      .to('#solution', {
        x: random(-10, 10),
        y: random(-20, 20),
        delay: 3,
        duration: 3,
      });
  }, []);

  return (
    <div className="relative h-screen bg-primary max-w-full overflow-hidden">
      <Header />
      <section className="basic-pd h-full absolute top-0 left-0 right-0">
        <div className="h-full flex items-center justify-center">
          <p className="font-dmSans max-w-[650px] max-md:max-w-[300px] h-[138px] text-center font-light text-[46px] max-md:text-[24px] tracking-3p leading-100 z-[3]">
            {paragraphs.hero}
          </p>
        </div>
      </section>
      <div className="w-full h-full sticky z-[1] flex items-center justify-center gap-[200px] max-md:gap-[50px] flex-wrap ">
        {solutionSlides.map((s) => (
          <div
            id="solution"
            key={s.id}
            className={`w-[264px] h-[248px] max-md:w-[124.95px] max-md:h-[117.45px] absolute ${s.id === 0 ? 'bottom-[90px] max-md:bottom-[47px] right-[50px] max-md:right-[40px]' : s.id === 1 ? 'bottom-[-50px] max-md:bottom-[190px] right-[358px]  max-md:right-[231px]' : s.id === 2 ? 'top-[-50px] max-md:top-[102px] left-[350px] max-md:left-[70px]' : s.id === 3 ? 'top-[20px] max-md:top-[282px] right-[250px] max-md:right-[304px]' : s.id === 4 ? 'top-[157px] max-md:top-[209px]  left-[30px] max-md:left-[238px]  ' : s.id === 5 ? 'bottom-[15px] max-md:bottom-[264px] left-[295px] max-md:left-[280px]' : ''}`}
          >
            <div
              id="wait"
              className="w-[16px] h-[16px] border-[1px] border-white bg-[#022D2D] border-opacity-30 absolute top-1/2 left-[-8px] opacity-0 max-md:hidden"
            ></div>
            <div
              id="wait"
              className="w-[16px] h-[16px] border-[1px] border-white border-opacity-30 bg-[#022D2D] absolute top-1/2 right-[8px] opacity-0 max-md:hidden"
            ></div>
            <div className="w-[249px] h-[249px] max-md:w-[117.4px] max-md:h-[117.45px] bg-[#023333] bg-opacity-50 rounded-[69px] max-md:rounded-[24px] flex justify-center items-center ">
              <div
                id="wait"
                className="w-[175px] h-[113px] max-md:w-[75.92px] max-md:h-[69.08px] opacity-0 flex items-center"
              >
                <img src={s.image.path} alt={s.title} className="opacity-30" />
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
