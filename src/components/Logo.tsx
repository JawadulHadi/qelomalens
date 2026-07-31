import React from 'react';
import { useIsDark } from '../hooks/useIsDark.js';

interface LogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, animated = false, className }) => {
  const isDark = useIsDark();
  const variant = `${animated ? 'animated' : 'static'}${isDark ? '-dark' : ''}`;

  return (
    <img
      src={`/brand/qeloma-logo-${variant}.svg`}
      width={size}
      height={size}
      alt="QelomaLens"
      className={className}
      style={{ width: size, height: size }}
    />
  );
};
