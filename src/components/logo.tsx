import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 350 100"
            className={className}
            fill="none"
        >
            <g id="logo-mark" transform="translate(20, 20)">
                <path
                    d="M10 10 L35 35 L10 60"
                    fill="none"
                    stroke="#1E3A8A"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M30 10 L55 35 L30 60"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                />
            </g>

            <text
                x="105"
                y="64"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="42"
                fontWeight="800"
                letterSpacing="-1px"
                fill="#1E3A8A"
            >
                Goal
                <tspan fill="#64748B" fontWeight="300">Flow</tspan>
            </text>
        </svg>
    );
};

export default Logo;