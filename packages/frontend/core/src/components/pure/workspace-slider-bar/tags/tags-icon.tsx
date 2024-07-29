// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import React from 'react';

interface FolderIconProps extends React.SVGProps<SVGSVGElement> {}

export const TagsIcon: React.FC<FolderIconProps> = props => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      {...{ ...props }}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.263 2.48a.735.735 0 0 0 .054 1.47l4.276-.159c.34-.012.67.117.911.358l6.307 6.307a.735.735 0 1 0 1.039-1.04L14.543 3.11a2.694 2.694 0 0 0-2.005-.788l-4.275.159Zm-.536 4.242a3.185 3.185 0 0 0-3.065 3.065l-.126 3.41c-.013.34.117.67.358.91l5.618 5.619a1.225 1.225 0 0 0 1.732 0l5.422-5.422a1.225 1.225 0 0 0 0-1.732l-5.618-5.618c-.241-.241-.572-.37-.912-.358l-3.41.126Zm-4.534 3.01a4.654 4.654 0 0 1 4.48-4.479l3.409-.126a2.695 2.695 0 0 1 2.005.788l5.618 5.617a2.695 2.695 0 0 1 0 3.811l-5.422 5.422a2.695 2.695 0 0 1-3.81 0l-5.619-5.618a2.694 2.694 0 0 1-.787-2.005l.126-3.41Zm4.673-.976a.828.828 0 1 1-1.17 1.17.828.828 0 0 1 1.17-1.17Z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};
