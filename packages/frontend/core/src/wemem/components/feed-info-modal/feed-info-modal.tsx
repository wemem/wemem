import { Modal, Scrollable } from '@affine/component';
import { FeedsService } from '@affine/core/modules/feeds';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';

import * as styles from './feed-info-modal.css';
import { FeedInfoTable } from './feed-info-table';
import { FeedAvatar } from '@affine/core/components/page-list/feed/avatar';

export const FeedInfoModal = () => {
  const feedsService = useService(FeedsService);
  const modal = feedsService.infoModal;
  const feedId = useLiveData(modal.feedId$);
  if (!feedId) return null;

  return <InfoModalOpened feedId={feedId} />;
};

const InfoModalOpened = ({ feedId }: { feedId: string }) => {
  const feedsService = useService(FeedsService);
  const modal = feedsService.infoModal;
  const feed = useLiveData(feedsService.feedById$(feedId));

  if (!feed) return null;

  return (
    <Modal
      contentOptions={{
        className: styles.container,
      }}
      open
      onOpenChange={v => modal.onOpenChange(v)}
      withoutCloseButton
    >
      <Scrollable.Root>
        <Scrollable.Viewport
          className={styles.viewport}
          data-testid="info-modal"
        >
          <div
            className={clsx(styles.titleContainer, styles.titleStyle)}
            data-testid="info-modal-title"
          >
            <FeedAvatar image={feed.icon} name={feed.name} />
            {feed.name}
          </div>
          <div>
            <FeedInfoTable className={styles.infoTable} feed={feed} />
          </div>
        </Scrollable.Viewport>
        <Scrollable.Scrollbar className={styles.scrollBar} />
      </Scrollable.Root>
    </Modal>
  );
};
