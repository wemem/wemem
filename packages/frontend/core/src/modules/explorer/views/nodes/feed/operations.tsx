import {
  EyeOpenIcon,
  MenuItem,
  MenuSeparator,
  toast,
  useConfirmModal,
} from '@affine/component';
import { useBlockSuiteDocMeta } from '@affine/core/components/hooks/use-block-suite-page-meta';
import { useFilteredPageMetas } from '@affine/core/components/page-list';
import { IsFavoriteIcon } from '@affine/core/components/pure/icons';
import type { FeedNode } from '@affine/core/modules/feeds';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/properties';
import { useI18n } from '@affine/i18n';
import track from '@affine/track';
import { DeleteIcon, InformationIcon } from '@blocksuite/icons/rc';
import {
  DocsService,
  useLiveData,
  useService,
  useServices,
  WorkspaceService,
} from '@toeverything/infra';
import { useCallback, useMemo, useState } from 'react';

import type { NodeOperation } from '../../tree/types';

export const FavoriteFolderOperation = ({ id }: { id: string }) => {
  const t = useI18n();
  const compatibleFavoriteItemsAdapter = useService(
    CompatibleFavoriteItemsAdapter
  );

  const favorite = useLiveData(
    useMemo(() => {
      return compatibleFavoriteItemsAdapter.isFavorite$(id, 'feedFolder');
    }, [compatibleFavoriteItemsAdapter, id])
  );

  return (
    <MenuItem
      prefixIcon={<IsFavoriteIcon favorite={favorite} />}
      onClick={() => compatibleFavoriteItemsAdapter.toggle(id, 'feedFolder')}
    >
      {favorite
        ? t['com.affine.rootAppSidebar.organize.folder-rm-favorite']()
        : t['com.affine.rootAppSidebar.organize.folder-add-favorite']()}
    </MenuItem>
  );
};

export const useExplorerFeedNodeOperations = (
  feed: FeedNode | null,
  options: {
    openInfoModal: () => void;
    openNodeCollapsed: () => void;
    removeNode: () => void;
  }
): NodeOperation[] => {
  const t = useI18n();
  const { workspaceService, compatibleFavoriteItemsAdapter } = useServices({
    WorkspaceService,
    CompatibleFavoriteItemsAdapter,
  });

  const { openConfirmModal } = useConfirmModal();
  const favorite = useLiveData(
    useMemo(() => {
      if (!feed) {
        return;
      }
      return compatibleFavoriteItemsAdapter.isFavorite$(
        feed.id as string,
        'feed'
      );
    }, [feed, compatibleFavoriteItemsAdapter])
  );

  const handleOpenInfoModal = useCallback(() => {
    track.$.feedInfoPanel.$.open();
    options.openInfoModal();
  }, [options]);

  const handleRemove = useCallback(() => {
    if (!feed) {
      return;
    }
    openConfirmModal({
      title: t['ai.wemem.feeds.delete.confirmModal.title'](),
      description: t['ai.wemem.feeds.delete.confirmModal.description']({
        title: feed.name$.value,
      }),
      confirmText: t['Confirm'](),
      cancelText: t['Cancel'](),
      confirmButtonOptions: {
        variant: 'error',
      },
      onConfirm() {
        options.removeNode();
        track.$.navigationPanel.docs.deleteDoc({
          control: 'button',
        });
        toast(t['ai.wemem.feeds.delete.toast']());
      },
    });
  }, [feed, openConfirmModal, options, t]);

  const handleToggleFavoriteDoc = useCallback(() => {
    if (!feed) {
      return;
    }
    compatibleFavoriteItemsAdapter.toggle(feed.id as string, 'feed');
    track.$.navigationPanel.feeds.toggleFavoriteFeedNode({
      type: 'feed',
    });
  }, [feed, compatibleFavoriteItemsAdapter]);

  const [marking, setMarking] = useState(false);
  const docCollection = workspaceService.workspace.docCollection;
  const pageMetas = useBlockSuiteDocMeta(docCollection);
  const docRecordList = useService(DocsService).list;
  const filteredPageMetas = useFilteredPageMetas(pageMetas, {
    feedFilter: feed
      ? {
          feedUrl: feed.url$.value,
        }
      : undefined,
  });
  const handleMarkAllAsRead = useCallback(() => {
    setMarking(true);
    filteredPageMetas.forEach(meta => {
      const record = docRecordList.doc$(meta.id).value;
      if (!record) {
        return;
      }
      record.markAsRead();
    });
    setMarking(false);
  }, [filteredPageMetas, docRecordList]);

  return useMemo(
    () => [
      {
        index: 50,
        view: (
          <MenuItem
            prefixIcon={<EyeOpenIcon />}
            onClick={handleMarkAllAsRead}
            disabled={marking}
          >
            {t['ai.wemem.feed-docs.mark-all-as-read']()}
          </MenuItem>
        ),
      },
      {
        index: 50,
        view: (
          <MenuItem
            prefixIcon={<InformationIcon />}
            onClick={handleOpenInfoModal}
          >
            {t['com.affine.page-properties.page-info.view']()}
          </MenuItem>
        ),
      },
      {
        index: 199,
        view: (
          <MenuItem
            prefixIcon={<IsFavoriteIcon favorite={favorite} />}
            onClick={handleToggleFavoriteDoc}
          >
            {favorite
              ? t['com.affine.favoritePageOperation.remove']()
              : t['com.affine.favoritePageOperation.add']()}
          </MenuItem>
        ),
      },
      {
        index: 9999,
        view: <MenuSeparator key="menu-separator" />,
      },
      {
        index: 10000,
        view: (
          <MenuItem
            type={'danger'}
            prefixIcon={<DeleteIcon />}
            onClick={handleRemove}
          >
            {t['Delete']()}
          </MenuItem>
        ),
      },
    ],
    [
      handleMarkAllAsRead,
      marking,
      t,
      handleOpenInfoModal,
      favorite,
      handleToggleFavoriteDoc,
      handleRemove,
    ]
  );
};
