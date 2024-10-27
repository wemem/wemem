import { IconButton, RssIcon } from '@affine/component';
import type { DocCollection } from '@affine/core/shared';
import { useI18n } from '@affine/i18n';
import { PageIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';

import { Spotlight } from '../spolight';
import * as styles from './index.css';

interface AddPageFeedButtonProps {
  onClickNewPage?: () => void;
  onOpenNewFeedModal: () => void;
  className?: string;
  docCollection: DocCollection;
}

export function AddPageFeedButton({
  onClickNewPage,
  onOpenNewFeedModal,
  className,
}: AddPageFeedButtonProps) {
  const t = useI18n();
  return (
    <div className={clsx(styles.root)}>
      <IconButton
        className={clsx([styles.button, className])}
        icon={<PageIcon />}
        onClick={onClickNewPage}
      >
        {t['New Page']()}
      </IconButton>
      <IconButton
        className={clsx([styles.button, className])}
        icon={<RssIcon />}
        onClick={onOpenNewFeedModal}
      >
        {t['ai.wemem.feeds.feed-search.modal-title']()}
      </IconButton>
      <Spotlight />
    </div>
  );
}
