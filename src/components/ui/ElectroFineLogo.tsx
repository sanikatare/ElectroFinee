import React from 'react';

interface ElectroFineLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

/**
 * Classic 3-arrow folded-ribbon Möbius recycling logo on a soft sage-green badge,
 * matching the uploaded reference image.
 */
export const ElectroFineLogo: React.FC<ElectroFineLogoProps> = ({
  size = 'md',
  showText = true,
  textClassName = 'text-white'
}) => {
  const dimensions = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl'
  }[size];

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }[size];

  // Mathematically balanced 120° rotational unit of the folded-ribbon Möbius recycling symbol
  const RecycleArm = ({ rotation }: { rotation: number }) => (
    <g transform={`rotate(${rotation} 50 50)`}>
      {/* Folded-under ribbon tail going up-right into the vertex */}
      <path
        d="M 23 35 L 34 16 C 36.5 11.5 40.5 9.5 43.5 10 L 49.5 20.5 L 43 28 L 35 42 Z"
        fill="#117A37"
      />
      {/* Folded-over arrow ribbon emerging from the vertex crease and pointing down-right */}
      <path
        d="M 46.5 10 C 50 10.5 53.5 13 56 17.5 L 61 26 L 67.5 22.2 L 61.5 41.5 L 42.5 36.8 L 49 33 L 44.5 25 Z"
        fill="#15883E"
      />
    </g>
  );

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className={`${dimensions} bg-[#B5D99C] border border-white/40 shadow-xs flex items-center justify-center shrink-0 overflow-hidden`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-[86%] h-[86%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="ElectroFine Recycling Logo"
        >
          <RecycleArm rotation={0} />
          <RecycleArm rotation={120} />
          <RecycleArm rotation={240} />
        </svg>
      </span>
      {showText && (
        <span className={`${textSizes} font-extrabold tracking-tight ${textClassName}`}>
          ElectroFine
        </span>
      )}
    </span>
  );
};
