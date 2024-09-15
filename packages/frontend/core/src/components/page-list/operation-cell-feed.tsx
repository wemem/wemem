import {
  IconButton,
  Menu,
  MenuIcon,
  MenuItem,
  toast,
  Tooltip,
} from '@affine/component';
import { useUnsubscribe } from '@affine/core/components/page-list/feed';
import { useEditSubscription } from '@affine/core/components/page-list/feed/use-edit-feed';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/properties';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { DeleteIcon, EditIcon, MoreVerticalIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { FavoriteTag } from './components/favorite-tag';
import * as styles from './list.css';
import { ColWrapper } from './utils';

export interface FeedOperationCellProps {
  collection: Collection;
}

export const FeedOperationCell = ({ collection }: FeedOperationCellProps) => {
  const t = useI18n();

  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const favourite = useLiveData(
    favAdapter.isFavorite$(collection.id, 'collection')
  );

  const { handleEditFeed, node: editNameModal } =
    useEditSubscription(collection);

  const deleteFeed = useUnsubscribe();

  const handleDelete = useCallback(() => {
    return deleteFeed(collection.id);
  }, [deleteFeed, collection.id]);

  const onToggleFavoriteCollection = useCallback(() => {
    const status = favAdapter.isFavorite(collection.id, 'collection');
    favAdapter.toggle(collection.id, 'collection');
    toast(
      status
        ? t['com.affine.toastMessage.removedFavorites']()
        : t['com.affine.toastMessage.addedFavorites']()
    );
  }, [favAdapter, collection.id, t]);

  return (
    <>
      {editNameModal}
      <ColWrapper
        hideInSmallContainer
        data-testid="page-list-item-favorite"
        data-favorite={favourite ? true : undefined}
        className={styles.favoriteCell}
      >
        <FavoriteTag onClick={onToggleFavoriteCollection} active={favourite} />
      </ColWrapper>
      <Tooltip content={t['ai.wemem.feed.menu.rename']()} side="top">
        <IconButton onClick={handleEditFeed}>
          <EditIcon />
        </IconButton>
      </Tooltip>
      <ColWrapper alignment="start">
        <Menu
          items={
            <MenuItem
              onClick={handleDelete}
              preFix={
                <MenuIcon>
                  <DeleteIcon />
                </MenuIcon>
              }
              type="danger"
            >
              {t['ai.wemem.subscriptions.unsubscribe']()}
            </MenuItem>
          }
          contentOptions={{
            align: 'end',
          }}
        >
          <IconButton variant="plain">
            <MoreVerticalIcon />
          </IconButton>
        </Menu>
      </ColWrapper>
    </>
  );
};
