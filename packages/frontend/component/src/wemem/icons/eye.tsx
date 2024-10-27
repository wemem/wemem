import type React from 'react';

interface EyeCloseIconProps {
  size?: number | string;
  className?: string;
  onClick?: () => void;
}

export const EyeCloseIcon: React.FC<EyeCloseIconProps> = ({
  size = '1em',
  className,
  onClick,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
    >
      <path d="M24 0V24H0V0H24Z" fill="currentColor" fillOpacity="0.01" />
      <path
        d="M14.3294 14.6934L14.9765 17.1082M18.3642 12.3638L20.132 14.1315M9.67048 14.6934L9.02343 17.1082M5.63569 12.3638L3.86792 14.1315M3.99994 9V9C6.35981 16.9645 17.6401 16.9645 19.9999 9V9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface EyeOpenIconProps {
  size?: number | string;
  className?: string;
  onClick?: () => void;
}

export const EyeOpenIcon: React.FC<EyeOpenIconProps> = ({
  size = '1em',
  className,
  onClick,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
    >
      <path d="M24 0V24H0V0H24Z" fill="currentColor" fillOpacity="0.01" />
      <path
        d="M21 12C21 15 16.9706 18.5 12 18.5C7.02944 18.5 3 15 3 12C3 9 7.02944 5.5 12 5.5C16.9706 5.5 21 9 21 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
};
