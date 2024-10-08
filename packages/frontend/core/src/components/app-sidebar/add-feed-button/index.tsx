import { useI18n } from '@affine/i18n';
import { PlusIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';
import type React from 'react';

import { Spotlight } from '../spolight';
import * as styles from './index.css';

interface AddPageButtonProps {
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function AddFeedButton({
  onClick,
  className,
  style,
}: AddPageButtonProps) {
  const t = useI18n();

  return (
    <button
      data-testid="sidebar-new-feed-button"
      style={style}
      className={clsx([styles.root, className])}
      onClick={onClick}
    >
      <PlusIcon className={styles.icon} />{' '}
      {t['ai.wemem.subscription.new-feed-button']()}
      <Spotlight />
    </button>
  );
}
