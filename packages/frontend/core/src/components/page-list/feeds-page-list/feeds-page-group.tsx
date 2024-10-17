import { DocDisplayMetaService } from '@affine/core/modules/doc-display-meta';
import type { Tag } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { assertExists } from '@blocksuite/global/utils';
import type { DocCollection, DocMeta } from '@blocksuite/store';
import { DocsService, useLiveData, useService } from '@toeverything/infra';
import { selectAtom } from 'jotai/utils';

import { PagePreview } from '../page-content-preview';
import {
  groupsAtom,
  listPropsAtom,
  selectionStateAtom,
  useAtomValue,
} from '../scoped-atoms';
import type { ListItem, ListProps, PageListItemProps } from '../types';
import { shallowEqual } from '../utils';
import { FeedsPageListItem } from './feeds-page-list-item';

// TODO(@Peng): optimize how to render page meta list item
const requiredPropNames = [
  'docCollection',
  'rowAsLink',
  'isPreferredEdgeless',
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

export const PageListItemRenderer = (item: ListItem) => {
  const props = useAtomValue(listsPropsAtom);
  const { selectionActive } = useAtomValue(selectionStateAtom);
  const groups = useAtomValue(groupsAtom);
  const pageItems = groups.flatMap(group => group.items).map(item => item.id);

  const page = item as DocMeta;
  return (
    <FeedsPageListItem
      {...pageMetaToListItemProp(
        page,
        {
          ...props,

          selectable: !!selectionActive,
        },
        pageItems
      )}
    />
  );
};

function tagIdToTagOption(
  tagId: string,
  docCollection: DocCollection
): Tag | undefined {
  return docCollection.meta.properties.tags?.options.find(
    opt => opt.id === tagId
  );
}

const PageTitle = ({ id }: { id: string }) => {
  const doc = useLiveData(useService(DocsService).list.doc$(id));
  const title = useLiveData(doc?.title$);
  const t = useI18n();
  return title || t['Untitled']();
};

const UnifiedPageIcon = ({ id }: { id: string }) => {
  const docDisplayMetaService = useService(DocDisplayMetaService);
  const Icon = useLiveData(docDisplayMetaService.icon$(id));
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
    title: <PageTitle id={item.id} />,
    preview: (
      <PagePreview docCollection={props.docCollection} pageId={item.id} />
    ),
    createDate: new Date(item.createDate),
    updatedDate: item.updatedDate ? new Date(item.updatedDate) : undefined,
    to: props.rowAsLink && !props.selectable ? `${to}` : undefined,
    onClick: toggleSelection,
    icon: <UnifiedPageIcon id={item.id} />,
    tags:
      item.tags
        ?.map(id => tagIdToTagOption(id, props.docCollection))
        .filter((v): v is Tag => v != null) ?? [],
    operations: props.operationsRenderer?.(item),
    selectable: props.selectable,
    selected: props.selectedIds?.includes(item.id),
    onSelectedChange: toggleSelection,
    draggable: props.draggable,
    isPublicPage: !!item.isPublic,
  };
  return itemProps;
}
