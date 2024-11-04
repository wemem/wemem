import { FeedAvatar } from '@affine/component';
import {
  listsPropsAtom,
  type RequiredProps,
} from '@affine/core/components/page-list/page-group';
import type { FeedListItemProps } from '@affine/core/components/page-list/types-feed';
import { assertExists } from '@blocksuite/global/utils';

import { FeedListItem } from './feeds';
import { selectionStateAtom, useAtomValue } from './scoped-atoms';
import type { CollectionMeta, ListItem } from './types';

function feedMetaToListItemProp(
  item: CollectionMeta,
  props: RequiredProps<CollectionMeta>
): FeedListItemProps {
  const toggleSelection = props.onSelectedIdsChange
    ? () => {
        assertExists(props.selectedIds);
        const prevSelected = props.selectedIds.includes(item.id);
        const shouldAdd = !prevSelected;
        const shouldRemove = prevSelected;

        if (shouldAdd) {
          props.onSelectedIdsChange?.([...props.selectedIds, item.id]);
        } else if (shouldRemove) {
          props.onSelectedIdsChange?.(
            props.selectedIds.filter(id => id !== item.id)
          );
        }
      }
    : undefined;
  const itemProps: FeedListItemProps = {
    feedId: item.id,
    title: item.title,
    description: item.feed?.description,
    to: props.rowAsLink && !props.selectable ? `/feed/${item.id}` : undefined,
    onClick: toggleSelection,
    icon: <FeedAvatar image={item.feed?.icon} />,
    operations: props.operationsRenderer?.(item),
    selectable: props.selectable,
    selected: props.selectedIds?.includes(item.id),
    onSelectedChange: toggleSelection,
    draggable: props.draggable,
  };
  return itemProps;
}

export const FeedListItemRenderer = (item: ListItem) => {
  const props = useAtomValue(listsPropsAtom);
  const { selectionActive } = useAtomValue(selectionStateAtom);
  const collection = item as CollectionMeta;
  return (
    <FeedListItem
      {...feedMetaToListItemProp(collection, {
        ...props,
        selectable: !!selectionActive,
      })}
    />
  );
};
