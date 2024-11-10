import type { FeedNode } from '@affine/core/modules/feeds';
import { useLiveData } from '@toeverything/infra';

import * as styles from './unread-bedge.css';

export const UnreadBadge = ({ node }: { node: FeedNode }) => {
  const unreadCount = useLiveData(node.unreadCount$);
  if (unreadCount === 0) {
    return null;
  }
  return <div className={styles.unreadBadge}>{unreadCount}</div>;
};
