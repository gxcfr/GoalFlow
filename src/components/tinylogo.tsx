import React from 'react';

export const LogoMark: React.FC<{ className?: string }> = ({ className = "h-8 w-8" }) => {
  return (
    <svg 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Primary Chevron */}
      <path 
        d="M18 12L34 32L18 52" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Accent Chevron */}
      <path 
        d="M34 12L50 32L34 52" 
        stroke="#94A3B8" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
};

export default LogoMark;
