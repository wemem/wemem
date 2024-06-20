import {
  IconButton,
  Menu,
  MenuIcon,
  MenuItem,
  toast,
  Tooltip,
} from '@affine/component';
import { useDeleteFeed } from '@affine/core/components/page-list/feed';
import { useEditFeed } from '@affine/core/components/page-list/feed/use-edit-feed';
import { FavoriteItemsAdapter } from '@affine/core/modules/properties';
import type { Collection } from '@affine/env/filter';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import {
  DeleteIcon,
  EditIcon,
  MoreVerticalIcon,
} from '@blocksuite/icons';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { FavoriteTag } from './components/favorite-tag';
import * as styles from './list.css';
import { ColWrapper } from './utils';

export interface FeedOperationCellProps {
  collection: Collection;
}

export const FeedOperationCell = ({ collection }: FeedOperationCellProps) => {
  const t = useAFFiNEI18N();

  const favAdapter = useService(FavoriteItemsAdapter);
  const favourite = useLiveData(
    favAdapter.isFavorite$(collection.id, 'collection'),
  );

  const { handleEditFeed, node: editNameModal } = useEditFeed(collection);


  const deleteFeed = useDeleteFeed();

  const handleDelete = useCallback(() => {
    return deleteFeed(collection.id);
  }, [deleteFeed, collection.id]);

  const onToggleFavoriteCollection = useCallback(() => {
    const status = favAdapter.isFavorite(collection.id, 'collection');
    favAdapter.toggle(collection.id, 'collection');
    toast(
      status
        ? t['com.affine.toastMessage.removedFavorites']()
        : t['com.affine.toastMessage.addedFavorites'](),
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
      <Tooltip content={t['ai.readflow.feed.menu.rename']()} side="top">
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
              {t['Delete']()}
            </MenuItem>
          }
          contentOptions={{
            align: 'end',
          }}
        >
          <IconButton type="plain">
            <MoreVerticalIcon />
          </IconButton>
        </Menu>
      </ColWrapper>
    </>
  );
};
