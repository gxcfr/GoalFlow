import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 80"
            fill="none"
            className={className}
        // Native transparency means no bg rect
        >
            <g id="logomark" transform="translate(10, 10)">
                <path
                    d="M15 15 L35 35 L15 55"
                    stroke="#FFFFFF"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M30 15 L50 35 L30 55"
                    stroke="#94A3B8"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                />
            </g>

            <text
                x="85"
                y="52"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="36"
                fontWeight="800"
                letterSpacing="-1.5px"
                fill="#FFFFFF"
            >
                Glow
                <tspan
                    fontWeight="300"
                    fill="#E2E8F0"
                >
                    Flow
                </tspan>
            </text>
        </svg>
    );
};

export default Logo;