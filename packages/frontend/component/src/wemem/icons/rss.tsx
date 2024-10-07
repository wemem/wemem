import type React from 'react';

interface RssIconProps {
  size?: number | string;
  className?: string;
  onClick?: () => void;
}

export const RssIcon: React.FC<RssIconProps> = ({
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
        d="M9 15.5C9 15.7761 8.77614 16 8.5 16C8.22386 16 8 15.7761 8 15.5C8 15.2239 8.22386 15 8.5 15C8.77614 15 9 15.2239 9 15.5Z"
        fill="currentColor"
      />
      <path
        d="M8 11.5C10.4853 11.5 12.5 13.5147 12.5 16M8 8.0164C8.16526 8.00552 8.33199 8 8.5 8C12.6421 8 16 11.3579 16 15.5C16 15.668 15.9945 15.8347 15.9836 16M9 15.5C9 15.7761 8.77614 16 8.5 16C8.22386 16 8 15.7761 8 15.5C8 15.2239 8.22386 15 8.5 15C8.77614 15 9 15.2239 9 15.5ZM6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const RssIcon2: React.FC<RssIconProps> = ({
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
        d="M6 18.5C6 18.7761 5.77614 19 5.5 19C5.22386 19 5 18.7761 5 18.5C5 18.2239 5.22386 18 5.5 18C5.77614 18 6 18.2239 6 18.5Z"
        fill="currentColor"
      />
      <path
        d="M5 5.00909C5.16592 5.00305 5.3326 5 5.5 5C12.9558 5 19 11.0442 19 18.5C19 18.6674 18.997 18.8341 18.9909 19M5 12.0189C5.16502 12.0064 5.33176 12 5.5 12C9.08985 12 12 14.9101 12 18.5C12 18.6682 11.9936 18.835 11.9811 19M6 18.5C6 18.7761 5.77614 19 5.5 19C5.22386 19 5 18.7761 5 18.5C5 18.2239 5.22386 18 5.5 18C5.77614 18 6 18.2239 6 18.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
