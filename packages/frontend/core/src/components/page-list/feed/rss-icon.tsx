// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import React from 'react';

interface FolderIconProps extends React.SVGProps<SVGSVGElement> {}

export const RssIcon: React.FC<FolderIconProps> = props => {
  return (
    <svg
      className="icon"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="20px"
      height="20px"
      style={{ userSelect: 'none', flexShrink: 0, ...props.style }}
      {...props}
    >
      <path
        d="M128 213.333333a682.666667 682.666667 0 0 1 682.666667 682.666667h85.333333A768 768 0 0 0 128 128v85.333333z"
        fill="currentColor"
      ></path>
      <path
        d="M274.944 541.226667A384 384 0 0 0 128 512v-85.333333a469.333333 469.333333 0 0 1 469.333333 469.333333h-85.333333a384 384 0 0 0-237.056-354.773333zM128 725.333333a170.666667 170.666667 0 0 1 170.666667 170.666667H128v-170.666667z"
        fill="currentColor"
      ></path>
    </svg>
  );
};
