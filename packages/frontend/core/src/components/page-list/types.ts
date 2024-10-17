import type { Collection, Tag } from '@affine/env/filter';
import type { DocCollection, DocMeta } from '@blocksuite/affine/store';
import type { PropsWithChildren, ReactNode } from 'react';
import type { To } from 'react-router-dom';

export type ListItem = DocMeta | CollectionMeta | TagMeta;

export interface CollectionMeta extends Collection {
  title: string;
  createDate?: Date | number;
  updatedDate?: Date | number;
}

export type TagMeta = {
  id: string;
  title: string;
  color: string;
  pageCount?: number;
  createDate?: Date | number;
  updatedDate?: Date | number;
};
// TODO(@JimmFly): consider reducing the number of props here
// using type instead of interface to make it Record compatible
export type PageListItemProps = {
  pageId: string;
  pageIds?: string[];
  icon: JSX.Element;
  title: ReactNode; // using ReactNode to allow for rich content rendering
  preview?: ReactNode; // using ReactNode to allow for rich content rendering
  tags: Tag[];
  createDate: Date;
  updatedDate?: Date;
  isPublicPage?: boolean;
  to?: To; // whether or not to render this item as a Link
  draggable?: boolean; // whether or not to allow dragging this item
  selectable?: boolean; // show selection checkbox
  selected?: boolean;
  operations?: ReactNode; // operations to show on the right side of the item
  onClick?: () => void;
  onSelectedChange?: () => void;
};

export type CollectionListItemProps = {
  collectionId: string;
  icon: JSX.Element;
  title: ReactNode; // using ReactNode to allow for rich content rendering
  createDate?: Date;
  updatedDate?: Date;
  to?: To; // whether or not to render this item as a Link
  draggable?: boolean; // whether or not to allow dragging this item
  selectable?: boolean; // show selection checkbox
  selected?: boolean;
  operations?: ReactNode; // operations to show on the right side of the item
  onClick?: () => void;
  onSelectedChange?: () => void;
};

export type TagListItemProps = {
  tagId: string;
  color: string;
  title: ReactNode; // using ReactNode to allow for rich content rendering
  pageCount?: number;
  createDate?: Date | number;
  updatedDate?: Date | number;
  to?: To; // whether or not to render this item as a Link
  draggable?: boolean; // whether or not to allow dragging this item
  selectable?: boolean; // show selection checkbox
  selected?: boolean;
  operations?: ReactNode; // operations to show on the right side of the item
  onClick?: () => void;
  onSelectedChange?: () => void;
};

export interface ItemListHeaderProps {}

// TODO(@JimmFly): a temporary solution. may need to be refactored later
export type ItemGroupByType = 'createDate' | 'updatedDate';
export interface SortBy {
  key: 'createDate' | 'updatedDate';
  order: 'asc' | 'desc';
}

export type DateKey = 'createDate' | 'updatedDate';
export type PageGroupByType =
  | 'createDate'
  | 'updatedDate'
  | 'tag'
  | 'favourites'
  | 'none';

export interface ListProps<T> {
  // required data:
  items: T[];
  docCollection: DocCollection;
  className?: string;
  hideHeader?: boolean; // whether or not to hide the header. default is false (showing header)
  groupBy?: ItemGroupDefinition<T>[];
  rowAsLink?: boolean;
  selectable?: 'toggle' | boolean; // show selection checkbox. toggle means showing a toggle selection in header on click; boolean == true means showing a selection checkbox for each item
  selectedIds?: string[]; // selected page ids
  onSelectedIdsChange?: (selected: string[]) => void;
  onSelectionActiveChange?: (active: boolean) => void;
  draggable?: boolean; // whether or not to allow dragging this page item
  // we also need the following to make sure the page list functions properly
  // maybe we could also give a function to render PageListItem?
  operationsRenderer?: (item: T) => ReactNode;
  // 当点击一个item时，需要跳转到的页面
  // to 就是跳转的地址
  // wrapTo 是一个函数，用于包装 to，比如在跳转到一个页面时，需要在地址前加上 /pages
  // 最初的场景是在订阅列表点击一个文档时，需要跳转到 /subscription/seen/:pageId
  wrapTo?: (to: string) => string;
}

export interface VirtualizedListProps<T> extends ListProps<T> {
  heading?: ReactNode; // the user provided heading part (non sticky, above the original header)
  headerRenderer?: (item?: T) => ReactNode; // the user provided header renderer
  itemRenderer?: (item: T) => ReactNode; // the user provided item renderer
  atTopThreshold?: number; // the threshold to determine whether or not the user has scrolled to the top. default is 0
  atTopStateChange?: (atTop: boolean) => void; // called when the user scrolls to the top or not
}

export interface ItemListHandle {
  toggleSelectable: () => void;
}

export interface ItemGroupDefinition<T> {
  id: string;
  // using a function to render custom group header
  label: ((count: number) => ReactNode) | ReactNode;
  match: (item: T) => boolean;
}

export interface ItemGroupProps<T> {
  id: string;
  label?: ReactNode; // if there is no label, it is a default group (without header)
  items: T[];
  allItems: T[];
}

type MakeRecord<T> = {
  [P in keyof T]: T[P];
};

export type MetaRecord<T> = MakeRecord<T>;

export type DraggableTitleCellData = {
  preview: ReactNode;
};

export type HeaderColDef = {
  key: string;
  content: ReactNode;
  flex: ColWrapperProps['flex'];
  alignment?: ColWrapperProps['alignment'];
  sortable?: boolean;
  hideInSmallContainer?: boolean;
  hidden?: boolean;
};

export type ColWrapperProps = PropsWithChildren<{
  flex?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  alignment?: 'start' | 'center' | 'end';
  styles?: React.CSSProperties;
  hideInSmallContainer?: boolean;
}> &
  React.HTMLAttributes<Element>;

export type PageDisplayProperties = {
  bodyNotes: boolean;
  tags: boolean;
  createDate: boolean;
  updatedDate: boolean;
};

export type DisplayProperties = {
  groupBy: PageGroupByType;
  displayProperties: PageDisplayProperties;
};
