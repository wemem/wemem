import { EyeCloseIcon, EyeOpenIcon } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { CloseIcon, DeleteIcon } from '@blocksuite/icons/rc';
import type { ReactNode } from 'react';

import { FloatingToolbar } from '../page-list';
import * as styles from './feeds-page-list-floating-toolbar.css';

export const ListFloatingToolbar = ({
  content,
  onClose,
  open,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
}: {
  open: boolean;
  content: ReactNode;
  onClose: () => void;
  onMarkAsRead?: () => void;
  onMarkAsUnread?: () => void;
  onDelete: () => void;
}) => {
  const t = useI18n();
  return (
    <FloatingToolbar className={styles.floatingToolbar} open={open}>
      <FloatingToolbar.Item>{content}</FloatingToolbar.Item>
      <FloatingToolbar.Button onClick={onClose} icon={<CloseIcon />} />
      <FloatingToolbar.Separator />

      {onMarkAsRead && (
        <FloatingToolbar.Button
          onClick={onMarkAsRead}
          icon={<EyeOpenIcon />}
          type="default"
          data-testid="feeds-list-toolbar-mark-as-read"
          label={t['ai.wemem.feed-docs.mark-as-read']()}
        />
      )}
      {onMarkAsUnread && (
        <FloatingToolbar.Button
          onClick={onMarkAsUnread}
          icon={<EyeCloseIcon />}
          type="default"
          data-testid="feeds-list-toolbar-mark-as-unread"
          label={t['ai.wemem.feed-docs.mark-as-unread']()}
        />
      )}
      <FloatingToolbar.Button
        onClick={onDelete}
        icon={<DeleteIcon />}
        type="danger"
        data-testid="feeds-list-toolbar-delete"
        label={t['ai.wemem.feed-docs.delete']()}
      />
    </FloatingToolbar>
  );
};
