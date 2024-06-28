import type { ReactNode } from 'react';
import type { To } from 'react-router-dom';

export type FeedListItemProps = {
  feedId: string;
  icon: JSX.Element;
  title: ReactNode; // using ReactNode to allow for rich content rendering
  description: ReactNode; // using ReactNode to allow for rich content rendering
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
