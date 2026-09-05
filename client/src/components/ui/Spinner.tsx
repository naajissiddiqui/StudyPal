import React from 'react';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

const sizeMap = {
  xs: 13,
  sm: 16,
  md: 22,
  lg: 32,
  xl: 44
};

const strokeMap = {
  xs: 2,
  sm: 2.2,
  md: 2.5,
  lg: 3,
  xl: 3.5
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'currentColor',
  className = '',
  style = {},
  label
}) => {
  const dimension = sizeMap[size] || 22;
  const strokeWidth = strokeMap[size] || 2.5;
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      role="status"
      aria-label={label || 'Loading...'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        lineHeight: 1,
        ...style
      }}
      className={className}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'studypal-spin 0.75s linear infinite',
          transformOrigin: 'center center',
          display: 'block'
        }}
      >
        {/* Subtle background track ring */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.18}
        />
        {/* Foreground active spinning arc */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.7}
        />
      </svg>
      {label && <span style={{ marginLeft: '8px' }}>{label}</span>}
    </span>
  );
};
