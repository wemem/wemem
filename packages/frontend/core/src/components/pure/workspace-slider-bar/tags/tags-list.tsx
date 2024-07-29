import { toast, useConfirmModal } from '@affine/component';
import { IconButton } from '@affine/component/ui/button';
import { usePageHelper } from '@affine/core/components/blocksuite/block-suite-page-list/utils';
import {
  stopPropagation,
  type TagMeta,
} from '@affine/core/components/page-list';
import {
  type DNDIdentifier,
  getDNDId,
  parseDNDId,
  resolveDragEndIntent,
} from '@affine/core/hooks/affine/use-global-dnd-helper';
import type { Tag } from '@affine/core/modules/tag';
import { TagService } from '@affine/core/modules/tag';
import { useTagI18N } from '@affine/core/modules/tag/entities/internal-tag';
import { useI18n } from '@affine/i18n';
import {
  MoreHorizontalIcon,
  PlusIcon,
  ViewLayersIcon,
} from '@blocksuite/icons/rc';
import { type DocCollection } from '@blocksuite/store';
import { type AnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useMemo, useState } from 'react';

import {
  useBlockSuiteDocMeta,
  useDocMetaHelper,
} from '../../../../hooks/use-block-suite-page-meta';
import { WorkbenchService } from '../../../../modules/workbench';
import { WorkbenchLink } from '../../../../modules/workbench/view/workbench-link';
import {
  CategoryDivider,
  MenuLinkItem as SidebarMenuLinkItem,
} from '../../../app-sidebar';
import { DragMenuItemOverlay } from '../components/drag-menu-item-overlay';
import * as draggableMenuItemStyles from '../components/draggable-menu-item.css';
import { AddTagButton } from './add-tag-button';
import { Doc } from './doc';
import { EditTagModal } from './edit-tag';
import * as styles from './styles.css';
import { TagOperations } from './tag-operations';
import { TagsIcon } from './tags-icon';
import { useCreateTag } from './use-create-tag';

const animateLayoutChanges: AnimateLayoutChanges = ({
  isSorting,
  wasDragging,
}) => (isSorting || wasDragging ? false : true);

export const TagSidebarNavItem = ({
  tag,
  docCollection,
  className,
  dndId,
}: {
  tag: Tag;
  docCollection: DocCollection;
  dndId: DNDIdentifier;
  className?: string;
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [open, setOpen] = useState(false);
  const tagService = useService(TagService);
  const { createPage } = usePageHelper(docCollection);
  const { setDocMeta } = useDocMetaHelper(docCollection);
  const { openConfirmModal } = useConfirmModal();
  const t = useI18n();
  const tt = useTagI18N();
  const tagMeta = useLiveData(tagService.tagList.tagMetaByTag(tag)) as TagMeta;

  const overlayPreview = useMemo(() => {
    return (
      <DragMenuItemOverlay
        icon={<ViewLayersIcon />}
        title={tt(tag.value$.getValue())}
      />
    );
  }, [tag.value$, tt]);

  const {
    setNodeRef,
    isDragging,
    attributes,
    listeners,
    transform,
    over,
    active,
    transition,
  } = useSortable({
    id: dndId,
    data: {
      preview: overlayPreview,
    },
    animateLayoutChanges,
  });

  const isSorting = parseDNDId(active?.id)?.where === 'sidebar-pin';
  const dragOverIntent = resolveDragEndIntent(active, over);
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isSorting ? transition : undefined,
  };

  const isOver = over?.id === dndId && dragOverIntent === 'collection:add';

  const currentPath = useLiveData(
    useService(WorkbenchService).workbench.location$.map(
      location => location.pathname
    )
  );
  const path = `/tag/${tag.id}`;

  const onRename = useCallback(
    (name: string) => {
      tag.rename(name);
      toast(t['com.affine.toastMessage.rename']());
    },
    [tag, t]
  );
  const openRenameModal = useCallback(() => {
    setOpen(true);
  }, []);

  const createAndAddDocument = useCallback(() => {
    const newDoc = createPage();
    setDocMeta(newDoc.id, { tags: [...(newDoc.meta?.tags || []), tag.id] });
  }, [createPage, setDocMeta, tag.id]);

  const onConfirmAddDocToTag = useCallback(() => {
    openConfirmModal({
      title: t['ai.readease.tag.add-doc.confirm.title'](),
      description: t['ai.readease.tag.add-doc.confirm.description'](),
      cancelText: t['Cancel'](),
      confirmButtonOptions: {
        type: 'primary',
        children: t['Confirm'](),
      },
      onConfirm: createAndAddDocument,
    });
  }, [createAndAddDocument, openConfirmModal, t]);

  return (
    <Collapsible.Root
      open={!collapsed}
      className={className}
      style={style}
      ref={setNodeRef}
      {...attributes}
    >
      <SidebarMenuLinkItem
        {...listeners}
        data-draggable={true}
        data-dragging={isDragging}
        className={draggableMenuItemStyles.draggableMenuItem}
        data-testid="tag-item"
        data-tag-id={tag.id}
        data-type="tag-list-item"
        onCollapsedChange={setCollapsed}
        active={isOver || currentPath === path}
        icon={<TagsIcon />}
        to={path}
        linkComponent={WorkbenchLink}
        postfix={
          <div
            onClick={stopPropagation}
            onMouseDown={e => {
              // prevent drag
              e.stopPropagation();
            }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <IconButton onClick={onConfirmAddDocToTag} size="small">
              <PlusIcon />
            </IconButton>
            <TagOperations
              tag={tag}
              openRenameModal={openRenameModal}
              onAddDocToTag={onConfirmAddDocToTag}
            >
              <IconButton
                data-testid="tag-options"
                type="plain"
                size="small"
                style={{ marginLeft: 4 }}
              >
                <MoreHorizontalIcon />
              </IconButton>
            </TagOperations>
            <EditTagModal
              open={open}
              onOpenChange={setOpen}
              onRename={onRename}
              tag={tag}
              tagMeta={tagMeta}
            />
          </div>
        }
        collapsed={collapsed}
      >
        <div className={styles.tagName}>
          <ListIconCell color={tag.color$.getValue()} />
          <span> {tt(tag.value$.getValue())}</span>
        </div>
      </SidebarMenuLinkItem>
      <Collapsible.Content className={styles.collapsibleContent}>
        {!collapsed && (
          <TagSidebarNavItemContent
            tag={tag}
            docCollection={docCollection}
            dndId={dndId}
          />
        )}
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

export const ListIconCell = ({ color }: { color: string }) => {
  return (
    <div className={styles.tagIndicatorWrapper}>
      <div
        className={styles.tagIndicator}
        style={{
          backgroundColor: color,
        }}
      />
    </div>
  );
};

export const TagSidebarNavItemContent = ({
  tag,
  docCollection,
  dndId,
}: {
  tag: Tag;
  docCollection: DocCollection;
  dndId: DNDIdentifier;
}) => {
  const t = useI18n();
  const pageMetas = useBlockSuiteDocMeta(docCollection);
  const pageIds = useLiveData(tag.pageIds$);

  const filtered = useMemo(() => {
    const pageIdsSet = new Set(pageIds);
    return pageMetas
      .filter(page => pageIdsSet.has(page.id))
      .sort(
        (a, b) =>
          new Date(b.createDate).getTime() - new Date(a.createDate).getTime()
      );
  }, [pageIds, pageMetas]);

  const placeholder = useCallback((_id: string) => {}, []);
  return (
    <div className={styles.docsListContainer}>
      {filtered.length > 0 ? (
        filtered.map(page => {
          return (
            <Doc
              docId={page.id}
              parentId={dndId}
              inAllowList={false}
              removeFromAllowList={placeholder}
              key={page.id}
            />
          );
        })
      ) : (
        <div className={styles.noReferences}>
          {t['ai.readease.tag.emptyTag']()}
        </div>
      )}
    </div>
  );
};

export type TagsListProps = {
  docCollection: DocCollection;
};

export const TagsList = ({ docCollection: workspace }: TagsListProps) => {
  const tagList = useService(TagService).tagList;
  const tags = useLiveData(tagList.tags$);
  const t = useI18n();
  const { node, open } = useCreateTag({
    title: t['ai.readease.createTag.modal.title'](),
  });

  const onCreate = useCallback(() => {
    open('');
  }, [open]);

  return (
    <>
      <CategoryDivider label={t['ai.readease.rootAppSidebar.tags']()}>
        <AddTagButton node={node} onClick={onCreate} />
      </CategoryDivider>
      {tags.length !== 0 && (
        <div data-testid="tags" className={styles.wrapper}>
          {tags.map(tag => {
            const dragItemId = getDNDId('sidebar-tags', 'tag', tag.id);

            return (
              <TagSidebarNavItem
                key={tag.id}
                tag={tag}
                docCollection={workspace}
                dndId={dragItemId}
              />
            );
          })}
        </div>
      )}
    </>
  );
};
