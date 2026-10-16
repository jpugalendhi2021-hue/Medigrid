import React from 'react';

interface MediGridLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const MediGridLogo: React.FC<MediGridLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeMap = {
    xs: { icon: 24, box: 'w-6 h-6', text: 'text-sm' },
    sm: { icon: 30, box: 'w-7 h-7 sm:w-8 sm:h-8', text: 'text-base' },
    md: { icon: 36, box: 'w-9 h-9', text: 'text-lg' },
    lg: { icon: 44, box: 'w-11 h-11', text: 'text-xl' },
    xl: { icon: 56, box: 'w-14 h-14', text: 'text-2xl' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* AI-Inspired Medical Grid Cross Logo Mark */}
      <div
        className={`relative ${currentSize.box} rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 p-0.5 shadow-md shadow-teal-700/20 flex items-center justify-center shrink-0 overflow-hidden group`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/25 via-transparent to-emerald-300/30 opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Scalable Vector SVG */}
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1 relative z-10"
        >
          {/* Defs: Gradients & Glow Filters */}
          <defs>
            <linearGradient id="crossGrad" x1="6" y1="6" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.7" stopColor="#E6FFFA" />
              <stop offset="1" stopColor="#99F6E4" />
            </linearGradient>

            <linearGradient id="gridLineGrad" x1="0" y1="22" x2="44" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2DD4BF" stopOpacity="0.3" />
              <stop offset="0.5" stopColor="#5EEAD4" stopOpacity="0.8" />
              <stop offset="1" stopColor="#2DD4BF" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="pulseGrad" x1="10" y1="22" x2="34" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0F766E" />
              <stop offset="0.5" stopColor="#042F2E" />
              <stop offset="1" stopColor="#0F766E" />
            </linearGradient>
          </defs>

          {/* 1. Underlying Dynamic Medical Grid Lines */}
          <line x1="8" y1="14" x2="36" y2="14" stroke="url(#gridLineGrad)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="8" y1="30" x2="36" y2="30" stroke="url(#gridLineGrad)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="14" y1="8" x2="14" y2="36" stroke="url(#gridLineGrad)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="30" y1="8" x2="30" y2="36" stroke="url(#gridLineGrad)" strokeWidth="1" strokeDasharray="2 2" />

          {/* 2. Grid Interconnection Node Dots (Hospital Cluster Points) */}
          <circle cx="14" cy="14" r="1.5" fill="#5EEAD4" opacity="0.9" />
          <circle cx="30" cy="14" r="1.5" fill="#5EEAD4" opacity="0.9" />
          <circle cx="14" cy="30" r="1.5" fill="#5EEAD4" opacity="0.9" />
          <circle cx="30" cy="30" r="1.5" fill="#5EEAD4" opacity="0.9" />

          {/* 3. Central Clinical Medical Cross (Precision Rounded Contour) */}
          <path
            d="M17 7C17 5.89543 17.8954 5 19 5H25C26.1046 5 27 5.89543 27 7V17H37C38.1046 17 39 17.8954 39 19V25C39 26.1046 38.1046 27 37 27H27V37C27 38.1046 26.1046 39 25 39H19C17.8954 39 17 38.1046 17 37V27H7C5.89543 27 5 26.1046 5 25V19C5 17.8954 5.89543 17 7 17H17V7Z"
            fill="url(#crossGrad)"
            filter="drop-shadow(0 2px 4px rgba(4, 47, 46, 0.25))"
          />

          {/* 4. Real-Time Dynamic ECG Pulse Rhythm Carved Inside the Cross */}
          <path
            d="M9 22H16L18 18L21 27L24 16L26 24L28 22H35"
            stroke="url(#pulseGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 5. Center Vital Indicator Node */}
          <circle cx="21" cy="27" r="1.2" fill="#0D9488" />
        </svg>
      </div>

      {showText && (
        <span className={`font-bold tracking-tight text-slate-800 ${currentSize.text}`}>
          Medi<span className="text-teal-600 font-semibold">Grid</span>
        </span>
      )}
    </div>
  );
};
