import { Button } from '@affine/component';
import type { DocCollection } from '@affine/core/shared';
import { useI18n } from '@affine/i18n';
import { PageIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';
import { PiRss } from 'react-icons/pi';

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
      <Button
        className={clsx([styles.button, className])}
        icon={<PageIcon />}
        onClick={onClickNewPage}>
        {t['New Page']()}
      </Button>
      <Button
        className={clsx([styles.button, className])}
        icon={<PiRss />}
        onClick={onOpenNewFeedModal}>
        {t['ai.readflow.feeds.new-feed-button']()}
      </Button>
      <Spotlight />
    </div>
  );
}
