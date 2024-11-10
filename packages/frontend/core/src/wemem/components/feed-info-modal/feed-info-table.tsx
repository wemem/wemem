import type { Feed } from '@affine/core/modules/feeds';
import { i18nTime, useI18n } from '@affine/i18n';
import {
  DateTimeIcon,
  HistoryIcon,
  LinkIcon,
  TextIcon,
} from '@blocksuite/icons/rc';
import clsx from 'clsx';
import type { ConfigType } from 'dayjs';
import { useDebouncedValue } from 'foxact/use-debounced-value';
import { type ReactNode, useMemo } from 'react';

import * as styles from './feed-info-table.css';

const RowComponent = ({
  name,
  icon,
  value,
}: {
  name: string;
  icon: ReactNode;
  value?: string | null;
}) => {
  return (
    <div className={styles.rowCell}>
      <div className={styles.rowNameContainer}>
        <div className={styles.icon}>{icon}</div>
        <span className={styles.rowName}>{name}</span>
      </div>
      <div className={styles.rowValue}>{value ? value : 'unknown'}</div>
    </div>
  );
};

export const FeedInfoTable = ({
  feed,
  className,
}: {
  feed: Feed;
  className?: string;
}) => {
  const t = useI18n();

  const element = useMemo(() => {
    const formatI18nTime = (time: ConfigType) =>
      i18nTime(time, {
        relative: {
          max: [1, 'day'],
          accuracy: 'minute',
        },
        absolute: {
          accuracy: 'day',
        },
      });

    return (
      <>
        {feed.description && (
          <RowComponent
            icon={<TextIcon />}
            name={t['ai.wemem.rootAppSidebar.feeds.info-modal.description']()}
            value={feed.description}
          />
        )}
        {feed.source && (
          <RowComponent
            icon={<LinkIcon />}
            name={t['ai.wemem.rootAppSidebar.feeds.info-modal.url']()}
            value={feed.source}
          />
        )}
        {feed.createdAt && (
          <RowComponent
            icon={<DateTimeIcon />}
            name={t['Created']()}
            value={formatI18nTime(feed.createdAt)}
          />
        )}
        {feed.updatedAt && (
          <RowComponent
            icon={<HistoryIcon />}
            name={t['Updated']()}
            value={formatI18nTime(feed.updatedAt)}
          />
        )}
      </>
    );
  }, [feed.createdAt, feed.description, feed.source, feed.updatedAt, t]);

  const dElement = useDebouncedValue(element, 500);

  return <div className={clsx(styles.container, className)}>{dElement}</div>;
};
