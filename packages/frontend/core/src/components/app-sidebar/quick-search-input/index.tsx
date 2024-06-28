import { useI18n } from '@affine/i18n';
import { SearchIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

import { Spotlight } from '../spolight';
import * as styles from './index.css';

interface QuickSearchInputProps extends HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
}

// Although it is called an input, it is actually a button.
export function QuickSearchInput({ onClick, ...props }: QuickSearchInputProps) {
  const t = useI18n();
  const isMac = environment.isBrowser && environment.isMacOs;

  return (
    <div
      {...props}
      className={clsx([props.className, styles.root])}
      onClick={onClick}
    >
      <SearchIcon className={styles.icon} />
      {t['Quick search']()}
      <div className={styles.spacer} />
      <div className={styles.shortcutHint}>
        {isMac ? ' ⌘ + K' : ' Ctrl + K'}
      </div>
      <Spotlight />
    </div>
  );
}
