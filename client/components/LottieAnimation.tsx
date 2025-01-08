import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieAnimationProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
}

const LottieAnimation: React.FC<LottieAnimationProps> = () => {
  return (
    <DotLottieReact
      src="/animation/process.lottie"
      loop
      autoplay
      className="lg:h-[400px] lg:w-[400px] max-md:h-[40vh]"
    />
  );
};

export default LottieAnimation;
