import { IconButton, Menu, MenuIcon, MenuItem } from '@affine/component';
import { useTrashModalHelper } from '@affine/core/hooks/affine/use-trash-modal-helper';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/properties';
import { getRefPageId } from '@affine/core/modules/tag/entities/internal-tag';
import { useI18n } from '@affine/i18n';
import {
  FavoritedIcon,
  FavoriteIcon,
  InformationIcon,
  MoreVerticalIcon,
  PageIcon,
} from '@blocksuite/icons/rc';
import type { DocMeta } from '@blocksuite/store';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import { useCallback, useState } from 'react';

import { InfoModal } from '../../affine/page-properties';
import { MoveToTrash } from '../operation-menu-items';
import { ColWrapper } from '../utils';
import { useDeepReading, useToggleFavoritePage } from './feeds-hooks';

export interface PageOperationCellProps {
  page: DocMeta;
  isInAllowList?: boolean;
  onRemoveFromAllowList?: () => void;
}

export const PageOperationCell = ({ page }: PageOperationCellProps) => {
  const t = useI18n();
  const currentWorkspace = useService(WorkspaceService).workspace;
  const { setTrashModal } = useTrashModalHelper(currentWorkspace.docCollection);
  const blocksuiteDoc = currentWorkspace.docCollection.getDoc(page.id);

  const refPageId = getRefPageId(page.tags) as string;
  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const favourite = useLiveData(favAdapter.isFavorite$(refPageId, 'doc'));

  const [openInfoModal, setOpenInfoModal] = useState(false);
  const onOpenInfoModal = () => {
    setOpenInfoModal(true);
  };

  const onRemoveToTrash = useCallback(() => {
    setTrashModal({
      open: true,
      pageIds: [page.id],
      pageTitles: [page.title],
    });
  }, [page.id, page.title, setTrashModal]);

  const deepReading = useDeepReading(page);
  const toggleFavoritePage = useToggleFavoritePage(page);

  const OperationMenu = (
    <>
      <MenuItem
        // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises
        onClick={async () => {
          await deepReading();
        }}
        preFix={
          <MenuIcon>
            <PageIcon />
          </MenuIcon>
        }
      >
        {t['ai.wemem.feeds.deep-reading']()}
      </MenuItem>
      <MenuItem
        // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises
        onClick={async () => {
          await toggleFavoritePage();
        }}
        preFix={
          <MenuIcon>
            {favourite ? (
              <FavoritedIcon style={{ color: 'var(--affine-primary-color)' }} />
            ) : (
              <FavoriteIcon />
            )}
          </MenuIcon>
        }
      >
        {favourite
          ? t['com.affine.favoritePageOperation.remove']()
          : t['com.affine.favoritePageOperation.add']()}
      </MenuItem>
      {runtimeConfig.enableInfoModal ? (
        <MenuItem
          onClick={onOpenInfoModal}
          preFix={
            <MenuIcon>
              <InformationIcon />
            </MenuIcon>
          }
        >
          {t['com.affine.page-properties.page-info.view']()}
        </MenuItem>
      ) : null}

      <MoveToTrash data-testid="move-to-trash" onSelect={onRemoveToTrash} />
    </>
  );
  return (
    <>
      <ColWrapper alignment="start">
        <Menu
          items={OperationMenu}
          contentOptions={{
            align: 'end',
          }}
        >
          <IconButton variant="plain" data-testid="page-list-operation-button">
            <MoreVerticalIcon />
          </IconButton>
        </Menu>
      </ColWrapper>
      {blocksuiteDoc ? (
        <InfoModal
          open={openInfoModal}
          onOpenChange={setOpenInfoModal}
          docId={blocksuiteDoc.id}
        />
      ) : null}
    </>
  );
};
