import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
gsap.registerPlugin(ScrollTrigger);

export const gsapAnimate = (target, animationsProps, scrollProps) => {
  gsap.to(target, {
    ...animationsProps,
    scrollTrigger: {
      ...scrollProps,
      trigger: target,
    },
  });
};

