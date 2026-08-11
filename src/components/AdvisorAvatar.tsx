import React from 'react';

interface AdvisorAvatarProps {
  className?: string;
  size?: number;
}

export const AdvisorAvatar: React.FC<AdvisorAvatarProps> = ({ className = '', size = 72 }) => {
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative rounded-full bg-white shadow-md border-2 border-white flex items-center justify-center shrink-0 overflow-hidden ${className}`}
    >
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-50 via-white to-blue-50" />
      
      {/* 1:1 Stylized Anqi / Flutter-like twin blue chevrons logo */}
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Outer Top Wing */}
        <path
          d="M 50 12 L 85 45 L 68 62 L 50 44 L 32 62 L 15 45 Z"
          fill="url(#blueGrad1)"
        />
        {/* Inner Bottom Wing */}
        <path
          d="M 50 40 L 85 73 L 68 90 L 50 72 L 32 90 L 15 73 Z"
          fill="url(#blueGrad2)"
        />
        <defs>
          <linearGradient id="blueGrad1" x1="15" y1="12" x2="85" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="blueGrad2" x1="15" y1="40" x2="85" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
