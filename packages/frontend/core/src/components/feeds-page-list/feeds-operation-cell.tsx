import { EyeCloseIcon, IconButton, Menu, MenuItem } from '@affine/component';
import { DocInfoService } from '@affine/core/modules/doc-info';
import { useI18n } from '@affine/i18n';
import track from '@affine/track';
import type { DocMeta } from '@blocksuite/affine/store';
import {
  FavoritedIcon,
  FavoriteIcon,
  InformationIcon,
  MoreVerticalIcon,
  PageIcon,
} from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { useFavorite } from '../blocksuite/block-suite-header/favorite';
import { ColWrapper } from '../page-list';
import { useDeepReading, useDocReadStatus } from './feeds-hooks';

export interface PageOperationCellProps {
  page: DocMeta;
  isInAllowList?: boolean;
  onRemoveFromAllowList?: () => void;
}

export const PageOperationCell = ({ page }: PageOperationCellProps) => {
  const t = useI18n();
  const { read, toggleRead } = useDocReadStatus(page.id);

  const { favorite, toggleFavorite } = useFavorite(page.id);

  const modal = useService(DocInfoService).modal;

  const onOpenInfoModal = useCallback(() => {
    track.$.header.actions.openDocInfo();
    modal.open(page.id);
  }, [page.id, modal]);

  const deepReading = useDeepReading(page.id);

  const OperationMenu = (
    <>
      <MenuItem
        // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises
        onClick={() => {
          deepReading();
        }}
        prefixIcon={<PageIcon />}
      >
        {t['ai.wemem.feeds.deep-reading']()}
      </MenuItem>
      <MenuItem
        onClick={() => {
          toggleFavorite();
        }}
        prefixIcon={
          favorite ? (
            <FavoritedIcon style={{ color: 'var(--affine-primary-color)' }} />
          ) : (
            <FavoriteIcon />
          )
        }
      >
        {favorite
          ? t['com.affine.favoritePageOperation.remove']()
          : t['com.affine.favoritePageOperation.add']()}
      </MenuItem>
      <MenuItem onClick={onOpenInfoModal} prefixIcon={<InformationIcon />}>
        {t['com.affine.page-properties.page-info.view']()}
      </MenuItem>
      {read && (
        <MenuItem onClick={toggleRead} prefixIcon={<EyeCloseIcon />}>
          {t['ai.wemem.feed-docs.mark-as-unread']()}
        </MenuItem>
      )}
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
