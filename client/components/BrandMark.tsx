import React from 'react';

interface BrandMarkProps {
  className?: string;
}

const BrandMark: React.FC<BrandMarkProps> = ({ className = '' }) => {
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        backgroundColor: 'var(--theme-brand-ink)',
        WebkitMask: 'url(/images/White.svg) no-repeat center / contain',
        mask: 'url(/images/White.svg) no-repeat center / contain',
      }}
    />
  );
};

export default BrandMark;
