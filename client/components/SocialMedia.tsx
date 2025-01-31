import React from 'react';

interface SocialMediaProps {
  text: string;
  path: string;
  alt: string;
  href: string;
}

const SocialMedia: React.FC<SocialMediaProps> = ({ text, path, alt, href }) => {
  return (
    <div className="h-[14px] flex  items-center gap-[10px]">
      <a
        href={href}
        target="_blank"
        className="uppercase text-[14px] font-medium font-diatype tracking-m3p"
      >
        {text}
      </a>
      <div className="h-[14px] w-[14px] flex items-center">
        <img src={path} alt={alt} className="w-[8px] h-[8px]" />
      </div>
    </div>
  );
};

export default SocialMedia;
