import type { FC } from 'react';

import { Logo1Icon, Logo1IconBorder } from '../../wemem/icons';
import { modalHeaderWrapper } from './share.css';
export const ModalHeader: FC<{
  title: string;
  subTitle: string;
}> = ({ title, subTitle }) => {
  return (
    <div className={modalHeaderWrapper}>
      <p>
        <Logo1IconBorder size="1em" className="logo" />
        {title}
      </p>
      <p>{subTitle}</p>
    </div>
  );
};
