'use client';

import { useId } from 'react';

export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  const rawId = useId();
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const stackGradId = `stack-grad-${cleanId}`;
  const boxGradId = `box-grad-${cleanId}`;

  return (
    <svg className={className} viewBox="0 0 90 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Orange Gradient for Stack */}
        <linearGradient id={stackGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9900" />
          <stop offset="100%" stopColor="#FF5500" />
        </linearGradient>

        {/* Box Gradient */}
        <linearGradient id={boxGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8A929A" />
          <stop offset="100%" stopColor="#545D66" />
        </linearGradient>
      </defs>

      {/* ICON GROUP */}
      <g id={`icon-${cleanId}`}>
        {/* Broken Tray / Box */}
        {/* Left Wall */}
        <path
          d="M 10 35 L 10 75 L 30 75"
          stroke={`url(#${boxGradId})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right Wall */}
        <path
          d="M 80 35 L 80 75 L 60 75"
          stroke={`url(#${boxGradId})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Broken Hole Indicators (Cracks/Dashes at the bottom) */}
        <line
          x1="33" y1="75" x2="38" y2="75"
          stroke="#8A929A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
        <line
          x1="52" y1="75" x2="57" y2="75"
          stroke="#8A929A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />

        {/* Top Stack Bars (Orderly) */}
        {/* Bar 1 (Top) */}
        <rect x="23" y="15" width="44" height="7" rx="3.5" fill={`url(#${stackGradId})`} />
        {/* Bar 2 (Slight Tilt) */}
        <rect
          x="23" y="27" width="44" height="7" rx="3.5"
          fill={`url(#${stackGradId})`}
          transform="rotate(4 45 30)"
        />
        {/* Bar 3 (Tilted More) */}
        <rect
          x="23" y="40" width="44" height="7" rx="3.5"
          fill={`url(#${stackGradId})`}
          transform="rotate(12 45 43)"
        />

        {/* Falling Stack Bars (Passing through the hole) */}
        {/* Bar 4 (Falling through center hole) */}
        <g className="falling-bar-1">
          <rect
            x="24" y="60" width="44" height="7" rx="3.5"
            fill={`url(#${stackGradId})`}
            transform="rotate(-12 46 63)"
          />
        </g>

        {/* Bar 5 (Dropped completely out to the bottom right) */}
        <g className="falling-bar-2">
          <rect
            x="35" y="82" width="44" height="7" rx="3.5"
            fill={`url(#${stackGradId})`}
            transform="rotate(35 57 85)"
          />
        </g>

        {/* Funny Motion Lines (Swoosh/Panic drops) */}
        <path
          d="M 32 78 Q 28 85 25 92"
          stroke="#FF5500"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M 58 78 Q 62 83 66 88"
          stroke="#FF5500"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}
