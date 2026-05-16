import React from 'react';

/**
 * GoalFlow Logo Component
 * Designed for dark backgrounds (Navy/Slate).
 * Features a transparent background and refined forward-motion chevrons.
 */
export const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 80"
            fill="none"
            className={className}
        >
            {/* Icon Mark: Chevrons indicating alignment and momentum */}
            <g id="logomark" transform="translate(10, 10)">
                {/* Leading Chevron (Primary - Current Color) */}
                <path
                    d="M15 15 L35 35 L15 55"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Following Chevron (Accent - Slate Gray) */}
                <path
                    d="M30 15 L50 35 L30 55"
                    stroke="#94A3B8"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                />
            </g>

            {/* Typography */}
            <text
                x="85"
                y="52"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="36"
                fontWeight="800"
                letterSpacing="-1.5px"
                fill="currentColor"
            >
                Glow
                <tspan
                    fontWeight="300"
                    fill="currentColor"
                    opacity="0.8"
                >
                    Flow
                </tspan>
            </text>
        </svg>
    );
};

export default Logo;