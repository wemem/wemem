import { EdgelessIcon, PageIcon } from '@blocksuite/icons/rc';
import { type DocMode, Entity, LiveData } from '@toeverything/infra';

import type { QuickSearchSession } from '../providers/quick-search-provider';
import type { QuickSearchGroup } from '../types/group';
import type { QuickSearchItem } from '../types/item';

const group = {
  id: 'creation',
  label: { key: 'com.affine.quicksearch.group.creation' },
  score: 0,
} as QuickSearchGroup;

export class CreationQuickSearchSession
  extends Entity
  implements QuickSearchSession<'creation', { title: string; mode: DocMode }>
{
  query$ = new LiveData('');

  items$ = LiveData.computed(get => {
    const query = get(this.query$);

    if (!query.trim()) {
      return [];
    }

    return [
      {
        id: 'creation:create-page',
        source: 'creation',
        label: {
          key: 'com.affine.cmdk.affine.create-new-page-as',
          options: { keyWord: query },
        },
        group,
        icon: PageIcon,
        payload: { mode: 'edgeless', title: query },
      },
      {
        id: 'creation:create-edgeless',
        source: 'creation',
        label: {
          key: 'com.affine.cmdk.affine.create-new-edgeless-as',
          options: { keyWord: query },
        },
        group,
        icon: EdgelessIcon,
        payload: { mode: 'edgeless', title: query },
      },
    ] as QuickSearchItem<'creation', { title: string; mode: DocMode }>[];
  });

  query(query: string) {
    this.query$.next(query);
  }
}
