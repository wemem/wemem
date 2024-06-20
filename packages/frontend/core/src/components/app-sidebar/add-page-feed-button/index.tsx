import { useCreateFeed } from '@affine/core/components/page-list';
import type { DocCollection } from '@affine/core/shared';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { PlusIcon } from '@blocksuite/icons';
import clsx from 'clsx';
import type React from 'react';

import { Spotlight } from '../spolight';
import * as styles from './index.css';

interface AddPageFeedButtonProps {
  onClickNewPage?: () => void;
  className?: string;
  style?: React.CSSProperties;
  docCollection: DocCollection;
}

export function AddPageFeedButton({
  onClickNewPage,
  className,
  style,
  docCollection,
}: AddPageFeedButtonProps) {
  const t = useAFFiNEI18N();
  const { node, handleCreateFeed } = useCreateFeed(docCollection);

  return (
    <div className={clsx(styles.root)}>
      <button
        data-testid="sidebar-new-page-button"
        style={style}
        className={clsx([styles.button, className])}
        onClick={onClickNewPage}
      >
        <PlusIcon className={styles.icon} /> {t['New Page']()}
      </button>
      <span>/</span>
      {node}
      <button
        data-testid="sidebar-new-page-button"
        style={style}
        className={clsx([styles.button, className])}
        onClick={handleCreateFeed}
      >
        {t['ai.readflow.feeds.new-feed-button']()}
      </button>
      <Spotlight />
    </div>
  );
}
