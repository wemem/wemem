import { Checkbox, Tooltip } from '@affine/component';
import { getDNDId } from '@affine/core/hooks/affine/use-global-dnd-helper';
import { TagService } from '@affine/core/modules/tag';
import {
  SubscriptionTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import { i18nTime } from '@affine/i18n';
import { useDraggable } from '@dnd-kit/core';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useMemo } from 'react';

import { WorkbenchLink } from '../../../modules/workbench/view/workbench-link';
import {
  anchorIndexAtom,
  rangeIdsAtom,
  selectionStateAtom,
  useAtom,
} from '../scoped-atoms';
import type { DraggableTitleCellData, PageListItemProps } from '../types';
import { ColWrapper, stopPropagation } from '../utils';
import { useSubscriptionPageListDisplayProperties } from './subscription-hooks';
import * as styles from './subscription-page-list-item.css';
import { SubscriptionPageTags } from './subscription-page-tags';

const ListTitleCell = ({
  title,
  tags,
  preview,
  pageId,
}: Pick<PageListItemProps, 'title' | 'preview' | 'tags' | 'pageId'>) => {
  const [displayProperties] = useSubscriptionPageListDisplayProperties();
  const isSubcription = useMemo(
    () => tags.findLast(tag => tag.id === SubscriptionTag.id),
    [tags]
  );

  return (
    <div data-testid="page-list-item-title" className={styles.titleCell}>
      <div
        data-testid="page-list-item-title-text"
        className={clsx(styles.titleCellMain, {
          [styles.titleCellMainForSubcription]: isSubcription,
        })}
      >
        {title}
      </div>
      {displayProperties.displayProperties.tags && (
        <PageTagsCell pageId={pageId} />
      )}
      {preview && displayProperties.displayProperties.bodyNotes ? (
        <div
          data-testid="page-list-item-preview-text"
          className={styles.titleCellPreview}
        >
          {preview}
        </div>
      ) : null}
    </div>
  );
};

const ListIconCell = ({
  icon,
  tags,
}: Pick<PageListItemProps, 'icon' | 'tags'>) => {
  const unseen = useMemo(
    () => tags.findLast(tag => tag.id === UnseenTag.id),
    [tags]
  );
  return (
    <div data-testid="page-list-item-icon" className={styles.iconCell}>
      {unseen && (
        <div
          className={styles.unseenLabel}
          data-testid="current-workspace-label"
        />
      )}
      {icon}
    </div>
  );
};

const PageSelectionCell = ({
  selectable,
  onSelectedChange,
  selected,
}: Pick<PageListItemProps, 'selectable' | 'onSelectedChange' | 'selected'>) => {
  const onSelectionChange = useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>) => {
      return onSelectedChange?.();
    },
    [onSelectedChange]
  );
  if (!selectable) {
    return null;
  }
  return (
    <div className={styles.selectionCell}>
      <Checkbox
        onClick={stopPropagation}
        checked={!!selected}
        onChange={onSelectionChange}
      />
    </div>
  );
};

export const PageTagsCell = ({ pageId }: Pick<PageListItemProps, 'pageId'>) => {
  const tagList = useService(TagService).tagList;
  const tags = useLiveData(tagList.tagsByPageId$(pageId));
  if (tags.length === 0) {
    return null;
  }
  return (
    <div data-testid="page-list-item-tags" className={styles.tagsCell}>
      <SubscriptionPageTags
        tags={tags}
        hoverExpandDirection="left"
        widthOnHover="300%"
        maxItems={5}
      />
    </div>
  );
};

const PageCreateDateCell = ({
  createDate,
}: Pick<PageListItemProps, 'createDate'>) => {
  return (
    <Tooltip content={i18nTime(createDate)}>
      <div
        data-testid="page-list-item-date"
        data-date-raw={createDate}
        className={styles.dateCell}
      >
        {i18nTime(createDate, {
          relative: true,
        })}
      </div>
    </Tooltip>
  );
};

const PageListOperationsCell = ({
  operations,
}: Pick<PageListItemProps, 'operations'>) => {
  return operations ? (
    <div onClick={stopPropagation} className={styles.operationsCell}>
      {operations}
    </div>
  ) : null;
};

export const SubscriptionPageListItem = (props: PageListItemProps) => {
  const [displayProperties] = useSubscriptionPageListDisplayProperties();
  const pageTitleElement = useMemo(() => {
    return (
      <div className={styles.dragPageItemOverlay}>
        <div className={styles.titleIconsWrapper}>
          <PageSelectionCell
            onSelectedChange={props.onSelectedChange}
            selectable={props.selectable}
            selected={props.selected}
          />
          <ListIconCell icon={props.icon} tags={props.tags} />
        </div>
        <ListTitleCell
          pageId={props.pageId}
          title={props.title}
          tags={props.tags}
          preview={props.preview}
        />
      </div>
    );
  }, [
    props.pageId,
    props.icon,
    props.onSelectedChange,
    props.preview,
    props.selectable,
    props.selected,
    props.title,
    props.tags,
  ]);

  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: getDNDId('doc-list', 'doc', props.pageId),
    data: {
      preview: pageTitleElement,
    } satisfies DraggableTitleCellData,
    disabled: !props.draggable,
  });

  return (
    <PageListItemWrapper
      onClick={props.onClick}
      to={props.to}
      pageId={props.pageId}
      draggable={props.draggable}
      isDragging={isDragging}
      pageIds={props.pageIds || []}
    >
      <ColWrapper flex={9}>
        <ColWrapper
          className={styles.dndCell}
          flex={8}
          ref={setNodeRef}
          {...attributes}
          {...listeners}
        >
          <div className={styles.titleIconsWrapper}>
            <PageSelectionCell
              onSelectedChange={props.onSelectedChange}
              selectable={props.selectable}
              selected={props.selected}
            />
            <ListIconCell icon={props.icon} tags={props.tags} />
          </div>
          <ListTitleCell
            pageId={props.pageId}
            title={props.title}
            tags={props.tags}
            preview={props.preview}
          />
        </ColWrapper>
      </ColWrapper>
      <ColWrapper
        flex={1}
        alignment="end"
        hidden={!displayProperties.displayProperties.createDate}
      >
        <PageCreateDateCell
          createDate={props.updatedDate ?? props.createDate}
        />
      </ColWrapper>
      {props.operations ? (
        <ColWrapper
          className={styles.actionsCellWrapper}
          flex={1}
          alignment="end"
        >
          <PageListOperationsCell operations={props.operations} />
        </ColWrapper>
      ) : null}
    </PageListItemWrapper>
  );
};

type PageListWrapperProps = PropsWithChildren<
  Pick<PageListItemProps, 'to' | 'pageId' | 'onClick' | 'draggable'> & {
    isDragging: boolean;
    pageIds: string[];
  }
>;

function PageListItemWrapper({
  to,
  isDragging,
  pageId,
  pageIds,
  onClick,
  children,
  draggable,
}: PageListWrapperProps) {
  const [selectionState, setSelectionActive] = useAtom(selectionStateAtom);
  const [anchorIndex, setAnchorIndex] = useAtom(anchorIndexAtom);
  const [rangeIds, setRangeIds] = useAtom(rangeIdsAtom);

  const handleShiftClick = useCallback(
    (currentIndex: number) => {
      if (anchorIndex === undefined) {
        setAnchorIndex(currentIndex);
        onClick?.();
        return;
      }

      const lowerIndex = Math.min(anchorIndex, currentIndex);
      const upperIndex = Math.max(anchorIndex, currentIndex);
      const newRangeIds = pageIds.slice(lowerIndex, upperIndex + 1);

      const currentSelected = selectionState.selectedIds || [];

      // Set operations
      const setRange = new Set(rangeIds);
      const newSelected = new Set(
        currentSelected.filter(id => !setRange.has(id)).concat(newRangeIds)
      );

      selectionState.onSelectedIdsChange?.([...newSelected]);
      setRangeIds(newRangeIds);
    },
    [
      anchorIndex,
      onClick,
      pageIds,
      selectionState,
      setAnchorIndex,
      rangeIds,
      setRangeIds,
    ]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!selectionState.selectable) {
        return;
      }
      stopPropagation(e);
      const currentIndex = pageIds.indexOf(pageId);

      if (e.shiftKey) {
        if (!selectionState.selectionActive) {
          setSelectionActive(true);
          setAnchorIndex(currentIndex);
          onClick?.();
          return false;
        }
        handleShiftClick(currentIndex);
        return false;
      } else {
        setAnchorIndex(undefined);
        setRangeIds([]);
        onClick?.();
        return;
      }
    },
    [
      handleShiftClick,
      onClick,
      pageId,
      pageIds,
      selectionState.selectable,
      selectionState.selectionActive,
      setAnchorIndex,
      setRangeIds,
      setSelectionActive,
    ]
  );

  const commonProps = useMemo(
    () => ({
      'data-testid': 'page-list-item',
      'data-page-id': pageId,
      'data-draggable': draggable,
      className: styles.root,
      'data-clickable': !!onClick || !!to,
      'data-dragging': isDragging,
      onClick: onClick ? handleClick : undefined,
    }),
    [pageId, draggable, onClick, to, isDragging, handleClick]
  );

  useEffect(() => {
    if (selectionState.selectionActive) {
      // listen for shift key up
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Shift') {
          setAnchorIndex(undefined);
          setRangeIds([]);
        }
      };
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
    return;
  }, [
    selectionState.selectionActive,
    setAnchorIndex,
    setRangeIds,
    setSelectionActive,
  ]);

  if (to) {
    return (
      <WorkbenchLink {...commonProps} to={to}>
        {children}
      </WorkbenchLink>
    );
  } else {
    return <div {...commonProps}>{children}</div>;
  }
}
