import {
  IconButton,
  Menu,
  MenuIcon,
  MenuItem,
  toast,
  useConfirmModal,
} from '@affine/component';
import { useAppSettingHelper } from '@affine/core/hooks/affine/use-app-setting-helper';
import { useBlockSuiteMetaHelper } from '@affine/core/hooks/affine/use-block-suite-meta-helper';
import { useTrashModalHelper } from '@affine/core/hooks/affine/use-trash-modal-helper';
import { useCatchEventCallback } from '@affine/core/hooks/use-catch-event-hook';
import { track } from '@affine/core/mixpanel';
import { FavoriteService } from '@affine/core/modules/favorite';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/properties';
import { WorkbenchService } from '@affine/core/modules/workbench';
import type { Collection, DeleteCollectionInfo } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import {
  DeleteIcon,
  DeletePermanentlyIcon,
  DuplicateIcon,
  EditIcon,
  FavoritedIcon,
  FavoriteIcon,
  FilterIcon,
  FilterMinusIcon,
  InformationIcon,
  MoreVerticalIcon,
  OpenInNewIcon,
  PlusIcon,
  ResetIcon,
  SplitViewIcon,
} from '@blocksuite/icons/rc';
import type { DocMeta } from '@blocksuite/store';
import {
  useLiveData,
  useService,
  useServices,
  WorkspaceService,
} from '@toeverything/infra';
import { useCallback, useState } from 'react';

import type { CollectionService } from '../../modules/collection';
import { InfoModal } from '../affine/page-properties';
import { usePageHelper } from '../blocksuite/block-suite-page-list/utils';
import { FavoriteTag } from './components/favorite-tag';
import * as styles from './list.css';
import { DisablePublicSharing, MoveToTrash } from './operation-menu-items';
import { CreateOrEditTag } from './tags/create-tag';
import type { TagMeta } from './types';
import { ColWrapper } from './utils';
import { useEditCollection, useEditCollectionName } from './view';

const tooltipSideTop = { side: 'top' as const };
const tooltipSideTopAlignEnd = { side: 'top' as const, align: 'end' as const };

export interface PageOperationCellProps {
  page: DocMeta;
  isInAllowList?: boolean;
  onRemoveFromAllowList?: () => void;
}

export const PageOperationCell = ({
  isInAllowList,
  page,
  onRemoveFromAllowList,
}: PageOperationCellProps) => {
  const t = useI18n();
  const currentWorkspace = useService(WorkspaceService).workspace;
  const { appSettings } = useAppSettingHelper();
  const { setTrashModal } = useTrashModalHelper(currentWorkspace.docCollection);
  const [openDisableShared, setOpenDisableShared] = useState(false);
  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const favourite = useLiveData(favAdapter.isFavorite$(page.id, 'doc'));
  const workbench = useService(WorkbenchService).workbench;
  const { duplicate } = useBlockSuiteMetaHelper(currentWorkspace.docCollection);
  const blocksuiteDoc = currentWorkspace.docCollection.getDoc(page.id);

  const [openInfoModal, setOpenInfoModal] = useState(false);
  const onOpenInfoModal = useCallback(() => {
    track.$.docInfoPanel.$.open();
    setOpenInfoModal(true);
  }, []);

  const onDisablePublicSharing = useCallback(() => {
    toast('Successfully disabled', {
      portal: document.body,
    });
  }, []);

  const onRemoveToTrash = useCallback(() => {
    track.allDocs.list.docMenu.deleteDoc();

    setTrashModal({
      open: true,
      pageIds: [page.id],
      pageTitles: [page.title],
    });
  }, [page.id, page.title, setTrashModal]);

  const onOpenInSplitView = useCallback(() => {
    track.allDocs.list.docMenu.openInSplitView();

    workbench.openDoc(page.id, { at: 'tail' });
  }, [page.id, workbench]);

  const onOpenInNewTab = useCallback(() => {
    workbench.openDoc(page.id, { at: 'new-tab' });
  }, [page.id, workbench]);

  const onToggleFavoritePage = useCallback(() => {
    const status = favAdapter.isFavorite(page.id, 'doc');
    favAdapter.toggle(page.id, 'doc');
    toast(
      status
        ? t['com.affine.toastMessage.removedFavorites']()
        : t['com.affine.toastMessage.addedFavorites']()
    );
  }, [page.id, favAdapter, t]);

  const onToggleFavoritePageOption = useCallback(() => {
    track.allDocs.list.docMenu.toggleFavorite();

    onToggleFavoritePage();
  }, [onToggleFavoritePage]);

  const onDuplicate = useCallback(() => {
    duplicate(page.id, false);
    track.allDocs.list.docMenu.createDoc({
      control: 'duplicate',
    });
  }, [duplicate, page.id]);

  const handleRemoveFromAllowList = useCallback(() => {
    if (onRemoveFromAllowList) {
      onRemoveFromAllowList();
      track.collection.docList.docMenu.removeOrganizeItem({ type: 'doc' });
    }
  }, [onRemoveFromAllowList]);

  const OperationMenu = (
    <>
      {page.isPublic && (
        <DisablePublicSharing
          data-testid="disable-public-sharing"
          onSelect={() => {
            setOpenDisableShared(true);
          }}
        />
      )}
      {isInAllowList && (
        <MenuItem
          onClick={handleRemoveFromAllowList}
          preFix={
            <MenuIcon>
              <FilterMinusIcon />
            </MenuIcon>
          }
        >
          {t['Remove special filter']()}
        </MenuItem>
      )}
      <MenuItem
        onClick={onToggleFavoritePageOption}
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

      <MenuItem
        onClick={onOpenInNewTab}
        preFix={
          <MenuIcon>
            <OpenInNewIcon />
          </MenuIcon>
        }
      >
        {t['com.affine.workbench.tab.page-menu-open']()}
      </MenuItem>

      {environment.isDesktop && appSettings.enableMultiView ? (
        <MenuItem
          onClick={onOpenInSplitView}
          preFix={
            <MenuIcon>
              <SplitViewIcon />
            </MenuIcon>
          }
        >
          {t['com.affine.workbench.split-view.page-menu-open']()}
        </MenuItem>
      ) : null}

      <MenuItem
        preFix={
          <MenuIcon>
            <DuplicateIcon />
          </MenuIcon>
        }
        onSelect={onDuplicate}
      >
        {t['com.affine.header.option.duplicate']()}
      </MenuItem>

      <MoveToTrash data-testid="move-to-trash" onSelect={onRemoveToTrash} />
    </>
  );
  return (
    <>
      <ColWrapper
        hideInSmallContainer
        data-testid="page-list-item-favorite"
        data-favorite={favourite ? true : undefined}
        className={styles.favoriteCell}
      >
        <FavoriteTag onClick={onToggleFavoritePage} active={favourite} />
      </ColWrapper>
      <ColWrapper alignment="start">
        <Menu
          items={OperationMenu}
          contentOptions={{
            align: 'end',
          }}
        >
          <IconButton data-testid="page-list-operation-button" size="20">
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
      <DisablePublicSharing.DisablePublicSharingModal
        onConfirm={onDisablePublicSharing}
        open={openDisableShared}
        onOpenChange={setOpenDisableShared}
      />
    </>
  );
};

export interface TrashOperationCellProps {
  onPermanentlyDeletePage: () => void;
  onRestorePage: () => void;
}

export const TrashOperationCell = ({
  onPermanentlyDeletePage,
  onRestorePage,
}: TrashOperationCellProps) => {
  const t = useI18n();
  const { openConfirmModal } = useConfirmModal();

  const onConfirmPermanentlyDelete = useCatchEventCallback(
    e => {
      e.preventDefault();
      openConfirmModal({
        title: `${t['com.affine.trashOperation.deletePermanently']()}?`,
        description: t['com.affine.trashOperation.deleteDescription'](),
        cancelText: t['Cancel'](),
        confirmText: t['com.affine.trashOperation.delete'](),
        confirmButtonOptions: {
          variant: 'error',
        },
        onConfirm: onPermanentlyDeletePage,
      });
    },
    [onPermanentlyDeletePage, openConfirmModal, t]
  );

  const handleRestorePage = useCatchEventCallback(
    e => {
      e.preventDefault();
      onRestorePage();
    },
    [onRestorePage]
  );

  return (
    <ColWrapper flex={1}>
      <IconButton
        tooltip={t['com.affine.trashOperation.restoreIt']()}
        tooltipOptions={tooltipSideTop}
        data-testid="restore-page-button"
        style={{ marginRight: '12px' }}
        onClick={handleRestorePage}
        size="20"
      >
        <ResetIcon />
      </IconButton>
      <IconButton
        tooltip={t['com.affine.trashOperation.deletePermanently']()}
        tooltipOptions={tooltipSideTopAlignEnd}
        data-testid="delete-page-button"
        onClick={onConfirmPermanentlyDelete}
        className={styles.deleteButton}
        iconClassName={styles.deleteIcon}
        size="20"
      >
        <DeletePermanentlyIcon />
      </IconButton>
    </ColWrapper>
  );
};

export interface CollectionOperationCellProps {
  collection: Collection;
  info: DeleteCollectionInfo;
  service: CollectionService;
}

export const CollectionOperationCell = ({
  collection,
  service,
  info,
}: CollectionOperationCellProps) => {
  const t = useI18n();

  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const docCollection = useService(WorkspaceService).workspace.docCollection;
  const { createPage } = usePageHelper(docCollection);
  const { openConfirmModal } = useConfirmModal();
  const favourite = useLiveData(
    favAdapter.isFavorite$(collection.id, 'collection')
  );

  const { open: openEditCollectionModal, node: editModal } =
    useEditCollection();

  const { open: openEditCollectionNameModal, node: editNameModal } =
    useEditCollectionName({
      title: t['com.affine.editCollection.renameCollection'](),
    });

  const handleEditName = useCallback(() => {
    // use openRenameModal if it is in the sidebar collection list
    openEditCollectionNameModal(collection.name)
      .then(name => {
        return service.updateCollection(collection.id, collection => ({
          ...collection,
          name,
        }));
      })
      .catch(err => {
        console.error(err);
      });
  }, [collection.id, collection.name, openEditCollectionNameModal, service]);

  const handleEdit = useCallback(() => {
    openEditCollectionModal(collection)
      .then(collection => {
        return service.updateCollection(collection.id, () => collection);
      })
      .catch(err => {
        console.error(err);
      });
  }, [openEditCollectionModal, collection, service]);

  const handleDelete = useCallback(() => {
    return service.deleteCollection(info, collection.id);
  }, [service, info, collection]);

  const onToggleFavoriteCollection = useCallback(() => {
    const status = favAdapter.isFavorite(collection.id, 'collection');
    favAdapter.toggle(collection.id, 'collection');
    toast(
      status
        ? t['com.affine.toastMessage.removedFavorites']()
        : t['com.affine.toastMessage.addedFavorites']()
    );
  }, [favAdapter, collection.id, t]);

  const createAndAddDocument = useCallback(() => {
    const newDoc = createPage();
    service.addPageToCollection(collection.id, newDoc.id);
  }, [collection.id, createPage, service]);

  const onConfirmAddDocToCollection = useCallback(() => {
    openConfirmModal({
      title: t['com.affine.collection.add-doc.confirm.title'](),
      description: t['com.affine.collection.add-doc.confirm.description'](),
      cancelText: t['Cancel'](),
      confirmText: t['Confirm'](),
      confirmButtonOptions: {
        variant: 'primary',
      },
      onConfirm: createAndAddDocument,
    });
  }, [createAndAddDocument, openConfirmModal, t]);

  return (
    <>
      {editModal}
      {editNameModal}
      <ColWrapper
        hideInSmallContainer
        data-testid="page-list-item-favorite"
        data-favorite={favourite ? true : undefined}
        className={styles.favoriteCell}
      >
        <FavoriteTag onClick={onToggleFavoriteCollection} active={favourite} />
      </ColWrapper>
      <IconButton
        onClick={handleEditName}
        tooltip={t['com.affine.collection.menu.rename']()}
        tooltipOptions={tooltipSideTop}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        onClick={handleEdit}
        tooltip={t['com.affine.collection.menu.edit']()}
        tooltipOptions={tooltipSideTop}
      >
        <FilterIcon />
      </IconButton>
      <ColWrapper alignment="start">
        <Menu
          items={
            <>
              <MenuItem
                onClick={onToggleFavoriteCollection}
                preFix={
                  <MenuIcon>
                    {favourite ? (
                      <FavoritedIcon
                        style={{ color: 'var(--affine-primary-color)' }}
                      />
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
              <MenuItem
                onClick={onConfirmAddDocToCollection}
                preFix={
                  <MenuIcon>
                    <PlusIcon />
                  </MenuIcon>
                }
              >
                {t['New Page']()}
              </MenuItem>
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
            </>
          }
          contentOptions={{
            align: 'end',
          }}
        >
          <IconButton>
            <MoreVerticalIcon />
          </IconButton>
        </Menu>
      </ColWrapper>
    </>
  );
};

interface TagOperationCellProps {
  tag: TagMeta;
  onTagDelete: (tagId: string[]) => void;
}

export const TagOperationCell = ({
  tag,
  onTagDelete,
}: TagOperationCellProps) => {
  const t = useI18n();
  const [open, setOpen] = useState(false);
  const { favoriteService } = useServices({
    FavoriteService,
  });
  const favourite = useLiveData(
    favoriteService.favoriteList.isFavorite$('tag', tag.id)
  );

  const handleDelete = useCallback(() => {
    onTagDelete([tag.id]);
  }, [onTagDelete, tag.id]);

  const onToggleFavoriteCollection = useCallback(() => {
    favoriteService.favoriteList.toggle('tag', tag.id);
  }, [favoriteService, tag.id]);
  return (
    <>
      <ColWrapper
        hideInSmallContainer
        data-testid="page-list-item-favorite"
        data-favorite={favourite ? true : undefined}
        className={styles.favoriteCell}
      >
        <FavoriteTag onClick={onToggleFavoriteCollection} active={favourite} />
      </ColWrapper>

      <div className={styles.editTagWrapper} data-show={open}>
        <div style={{ width: '100%' }}>
          <CreateOrEditTag open={open} onOpenChange={setOpen} tagMeta={tag} />
        </div>
      </div>

      <IconButton
        tooltip={t['Rename']()}
        tooltipOptions={tooltipSideTop}
        onClick={() => setOpen(true)}
      >
        <EditIcon />
      </IconButton>

      <ColWrapper alignment="start">
        <Menu
          items={
            <MenuItem
              preFix={
                <MenuIcon>
                  <DeleteIcon />
                </MenuIcon>
              }
              type="danger"
              onSelect={handleDelete}
            >
              {t['Delete']()}
            </MenuItem>
          }
          contentOptions={{
            align: 'end',
          }}
        >
          <IconButton>
            <MoreVerticalIcon />
          </IconButton>
        </Menu>
      </ColWrapper>
    </>
  );
};
