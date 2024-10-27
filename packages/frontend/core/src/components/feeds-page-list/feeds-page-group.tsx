import { rcIcons } from '@affine/core/modules/doc-display-meta/services/doc-display-meta';
import { useI18n } from '@affine/i18n';
import type { DocMeta, Tag } from '@blocksuite/affine/store';
import { assertExists } from '@blocksuite/global/utils';
import dayjs from 'dayjs';
import { selectAtom } from 'jotai/utils';

import {
  type ListItem,
  type ListProps,
  type PageListItemProps,
  shallowEqual,
  tagIdToTagOption,
} from '../page-list';
import { PagePreview } from '../page-list/page-content-preview';
import {
  groupsAtom,
  listPropsAtom,
  selectionStateAtom,
  useAtomValue,
} from '../page-list/scoped-atoms';
import { FeedsPageListItem } from './feeds-page-list-item';

// TODO(@Peng): optimize how to render page meta list item
const requiredPropNames = [
  'docCollection',
  'rowAsLink',
  'operationsRenderer',
  'selectedIds',
  'onSelectedIdsChange',
  'draggable',
  'wrapTo',
] as const;

export type RequiredProps<T> = Pick<
  ListProps<T>,
  (typeof requiredPropNames)[number]
> & {
  selectable: boolean;
};

export const listsPropsAtom = selectAtom(
  listPropsAtom,
  props => {
    return Object.fromEntries(
      requiredPropNames.map(name => [name, props?.[name]])
    ) as RequiredProps<ListItem>;
  },
  shallowEqual
);

export const PageListItemRenderer = ({ item }: { item: ListItem }) => {
  const props = useAtomValue(listsPropsAtom);
  const { selectionActive } = useAtomValue(selectionStateAtom);
  const groups = useAtomValue(groupsAtom);
  const pageItems = groups.flatMap(group => group.items).map(item => item.id);
  const docMeta = item as DocMeta;
  return (
    <FeedsPageListItem
      {...pageMetaToListItemProp(
        docMeta,
        {
          ...props,

          selectable: !!selectionActive,
        },
        pageItems
      )}
    />
  );
};

const PageTitle = ({ docMeta }: { docMeta: DocMeta }) => {
  const title = docMeta.title;
  const t = useI18n();
  return title || t['Untitled']();
};

const UnifiedPageIcon = ({ createdAt }: { createdAt: number }) => {
  const createDate = dayjs(createdAt);
  const today = dayjs();

  let Icon = rcIcons.PageIcon;
  const isToday = createDate.isSame(today, 'day');
  if (isToday) {
    Icon = rcIcons.TodayIcon;
  }

  const isYesterday = createDate.isSame(today.subtract(1, 'day'), 'day');
  if (isYesterday) {
    Icon = rcIcons.YesterdayIcon;
  }

  return <Icon />;
};

function pageMetaToListItemProp(
  item: DocMeta,
  props: RequiredProps<DocMeta>,
  pageIds?: string[]
): PageListItemProps {
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
  const to = props.wrapTo ? props.wrapTo(`/${item.id}`) : `/${item.id}`;
  const itemProps: PageListItemProps = {
    pageId: item.id,
    pageIds,
    title: <PageTitle docMeta={item} />,
    preview: (
      <PagePreview docCollection={props.docCollection} pageId={item.id} />
    ),
    createDate: new Date(item.createDate),
    to: props.rowAsLink && !props.selectable ? `${to}` : undefined,
    onClick: toggleSelection,
    icon: <UnifiedPageIcon createdAt={item.createDate} />,
    tags:
      item.tags
        ?.map(id => tagIdToTagOption(id, props.docCollection))
        .filter((v): v is Tag => v != null) ?? [],
    operations: props.operationsRenderer?.(item),
    selectable: props.selectable,
    selected: props.selectedIds?.includes(item.id),
    onSelectedChange: toggleSelection,
    draggable: props.draggable,
  };
  return itemProps;
}
