import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieAnimationProps {
  src: string; // URL of the .lottie file
  loop?: boolean;
  autoplay?: boolean;
}

const LottieAnimation: React.FC<LottieAnimationProps> = () => {
  return (
    <DotLottieReact
      src="/animation/process.lottie"
      loop
      autoplay
      className="lg:h-[400px] lg:w-[600px] max-md:w-full"
    />
  );
};

export default LottieAnimation;
