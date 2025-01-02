import React from 'react';

interface SocialMediaProps {
  text: string;
  path: string;
  alt: string;
}

const SocialMedia: React.FC<SocialMediaProps> = ({ text, path, alt }) => {
  return (
    <div className="w-full h-[14px] flex  items-center gap-[10px]">
      <a href="/" className="uppercase text-[14px] font-medium h-[14px]">
        {text}
      </a>
      <div className="h-[14px] w-[14px] flex items-center">
        <img src={path} alt={alt} className="w-[8px] h-[8px]" />
      </div>
    </div>
  );
};

export default SocialMedia;
