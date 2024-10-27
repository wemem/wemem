// Import necessary dependencies and components
import { Checkbox, Tooltip } from '@affine/component';
import { TagService } from '@affine/core/modules/tag';
import { FeedTag } from '@affine/core/modules/tag/entities/internal-tag';
import { stopPropagation } from '@affine/core/utils';
import { i18nTime } from '@affine/i18n';
import { useDraggable } from '@dnd-kit/core';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useAtom } from 'jotai/react';
import type { LegacyRef, PropsWithChildren } from 'react';
import type React from 'react';
import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';

import { WorkbenchLink } from '../../modules/workbench/view/workbench-link';
import {
  ColWrapper,
  type DraggableTitleCellData,
  type PageListItemProps,
} from '../page-list';
import {
  anchorIndexAtom,
  rangeIdsAtom,
  selectionStateAtom,
} from '../page-list/scoped-atoms';
import {
  useDocReadStatus,
  useFeedsPageListDisplayProperties,
} from './feeds-hooks';
import * as styles from './feeds-page-list-item.css';
import { FeedsPageTags } from './feeds-page-tags';

// Render title cell
const ListTitleCell = ({
  title,
  tags,
  preview,
  pageId,
  createDate,
  updatedDate,
  read,
}: Pick<
  PageListItemProps,
  'title' | 'preview' | 'tags' | 'pageId' | 'createDate' | 'updatedDate'
> & { read: boolean }) => {
  const [displayProperties] = useFeedsPageListDisplayProperties();
  const isSubcription = useMemo(
    () => tags.findLast(tag => tag.id === FeedTag.id),
    [tags]
  );

  const createAt = useMemo(() => {
    return createDate ?? updatedDate;
  }, [createDate, updatedDate]);

  return (
    <div data-testid="page-list-item-title" className={styles.titleCell}>
      <div
        data-testid="page-list-item-title-text"
        className={clsx(
          styles.titleCellMain,
          {
            [styles.titleCellMainForSubcription]: isSubcription,
          },
          read ? styles.readColor : styles.unreadColor
        )}
      >
        {title}
      </div>
      {displayProperties.displayProperties.tags && (
        <PageTagsCell pageId={pageId} />
      )}

      {(preview || createAt) && (
        <div
          data-testid="page-list-item-preview-text"
          className={styles.titleCellPreview}
        >
          <PageCreateDateCell createDate={createAt} />- {preview}
        </div>
      )}
    </div>
  );
};

// Render icon cell
const ListIconCell = ({
  icon,
  read,
}: Pick<PageListItemProps, 'icon'> & { read: boolean }) => {
  return (
    <div
      data-testid="page-list-item-icon"
      className={clsx(
        styles.iconCell,
        read ? styles.readColor : styles.unreadColor
      )}
    >
      {icon}
    </div>
  );
};

// Render selection cell
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

// Render tags cell
export const PageTagsCell = ({ pageId }: Pick<PageListItemProps, 'pageId'>) => {
  const tagList = useService(TagService).tagList;
  const tags = useLiveData(tagList.tagsByPageId$(pageId));
  if (tags.length === 0) {
    return null;
  }
  return (
    <div data-testid="page-list-item-tags" className={styles.tagsCell}>
      <FeedsPageTags
        tags={tags}
        hoverExpandDirection="left"
        widthOnHover="300%"
        maxItems={5}
      />
    </div>
  );
};

// Render create date cell
const PageCreateDateCell = ({
  createDate,
}: Pick<PageListItemProps, 'createDate'>) => {
  return (
    <Tooltip content={i18nTime(createDate)}>
      <span className={styles.dateCell}>
        {i18nTime(createDate, {
          relative: true,
        })}
      </span>
    </Tooltip>
  );
};

// Render operations cell
const PageListOperationsCell = ({
  operations,
}: Pick<PageListItemProps, 'operations'>) => {
  return operations ? (
    <div onClick={stopPropagation} className={styles.operationsCell}>
      {operations}
    </div>
  ) : null;
};

// Main FeedsPageListItem component
export const FeedsPageListItem = (props: PageListItemProps) => {
  const { read, toggleRead } = useDocReadStatus(props.pageId);

  const pageTitleElement = useMemo(() => {
    return (
      <div className={styles.dragPageItemOverlay}>
        <div className={styles.titleIconsWrapper}>
          <PageSelectionCell
            onSelectedChange={props.onSelectedChange}
            selectable={props.selectable}
            selected={props.selected}
          />
          <ListIconCell icon={props.icon} read={read} />
        </div>
        <ListTitleCell {...props} read={read} />
      </div>
    );
  }, [props, read]);

  // Set up drag functionality
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: props.pageId,
    data: {
      preview: pageTitleElement,
    } satisfies DraggableTitleCellData,
    disabled: !props.draggable,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // Handle mouse hover logic to automatically mark as read
  useEffect(() => {
    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => {
        if (!read) {
          toggleRead();
        }
      }, 500);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const element = itemRef.current;
    if (element) {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [props, props.pageId, read, toggleRead]);

  return (
    <PageListItemWrapper
      ref={itemRef}
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
            <ListIconCell icon={props.icon} read={read} />
          </div>
          <ListTitleCell {...props} read={read} />
        </ColWrapper>
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

// PageListItemWrapper component, handling selection and click logic
const PageListItemWrapper = forwardRef<HTMLDivElement, PageListWrapperProps>(
  ({ to, isDragging, pageId, pageIds, onClick, children, draggable }, ref) => {
    const [selectionState, setSelectionActive] = useAtom(selectionStateAtom);
    const [anchorIndex, setAnchorIndex] = useAtom(anchorIndexAtom);
    const [rangeIds, setRangeIds] = useAtom(rangeIdsAtom);

    // Handle Shift-click logic
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

    // Handle click event
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

    // Listen for Shift key release event
    useEffect(() => {
      if (selectionState.selectionActive) {
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

    // Return different wrapper components based on whether there's a link
    if (to) {
      return (
        <WorkbenchLink
          {...commonProps}
          to={to}
          ref={ref as LegacyRef<HTMLAnchorElement>}
        >
          {children}
        </WorkbenchLink>
      );
    } else {
      return (
        <div {...commonProps} ref={ref}>
          {children}
        </div>
      );
    }
  }
);
