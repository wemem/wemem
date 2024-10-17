import { IconButton, Menu, MenuItem } from '@affine/component';
import { DocInfoService } from '@affine/core/modules/doc-info';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/properties';
import { getRefPageId } from '@affine/core/modules/tag/entities/internal-tag';
import { useI18n } from '@affine/i18n';
import track from '@affine/track';
import {
  FavoritedIcon,
  FavoriteIcon,
  InformationIcon,
  MoreVerticalIcon,
  PageIcon,
} from '@blocksuite/icons/rc';
import type { DocMeta } from '@blocksuite/store';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { useTrashModalHelper } from '../../hooks/affine/use-trash-modal-helper';
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
  const { setTrashModal } = useTrashModalHelper();

  const refPageId = getRefPageId(page.tags) as string;
  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const favourite = useLiveData(favAdapter.isFavorite$(refPageId, 'doc'));

  const modal = useService(DocInfoService).modal;

  const onOpenInfoModal = useCallback(() => {
    track.$.header.actions.openDocInfo();
    modal.open(page.id);
  }, [page.id, modal]);

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
        prefixIcon={<PageIcon />}
      >
        {t['ai.wemem.feeds.deep-reading']()}
      </MenuItem>
      <MenuItem
        // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises
        onClick={async () => {
          await toggleFavoritePage();
        }}
        prefixIcon={
          favourite ? (
            <FavoritedIcon style={{ color: 'var(--affine-primary-color)' }} />
          ) : (
            <FavoriteIcon />
          )
        }
      >
        {favourite
          ? t['com.affine.favoritePageOperation.remove']()
          : t['com.affine.favoritePageOperation.add']()}
      </MenuItem>
      <MenuItem onClick={onOpenInfoModal} prefixIcon={<InformationIcon />}>
        {t['com.affine.page-properties.page-info.view']()}
      </MenuItem>
      <MoveToTrash data-testid="move-to-trash" onSelect={onRemoveToTrash} />
    </>
  );
  return (
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
  );
};
