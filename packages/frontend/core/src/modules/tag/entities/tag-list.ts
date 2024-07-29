import { InternalTags } from '@affine/core/modules/tag/entities/internal-tag';
import type { DocsService } from '@toeverything/infra';
import { Entity, LiveData } from '@toeverything/infra';

import { Tag } from '../entities/tag';
import type { TagStore } from '../stores/tag';

export class TagList extends Entity {
  constructor(
    private readonly store: TagStore,
    private readonly docs: DocsService
  ) {
    super();
    this.initInternalTags();
  }

  readonly tags$ = LiveData.from(this.store.watchTagIds(), []).map(ids => {
    return ids
      .map(id => this.framework.createEntity(Tag, { id }))
      .filter(tag => {
        return tag.ghost$.value === undefined ? true : !tag.ghost$.value;
      });
  });

  createTag(value: string, color: string) {
    const newId = this.store.createNewTag(value, color);
    const newTag = this.framework.createEntity(Tag, { id: newId });
    return newTag;
  }

  createTagWithId(
    newId: string,
    value: string,
    color: string,
    ghost?: boolean
  ) {
    this.store.createNewTagWithId(newId, value, color, ghost);
    const newTag = this.framework.createEntity(Tag, { id: newId });
    return newTag;
  }

  createGhostTagWithId(newId: string, value: string, color: string) {
    this.store.createNewTagWithId(newId, value, color, true);
    const newTag = this.framework.createEntity(Tag, { id: newId });
    return newTag;
  }

  deleteTag(tagId: string) {
    this.store.deleteTag(tagId);
  }

  tagsByPageId$(pageId: string) {
    return LiveData.computed(get => {
      const docRecord = get(this.docs.list.doc$(pageId));
      if (!docRecord) return [];
      const tagIds = get(docRecord.meta$).tags;

      return get(this.tags$).filter(tag => (tagIds ?? []).includes(tag.id));
    });
  }

  tagIdsByPageId$(pageId: string) {
    return this.tagsByPageId$(pageId).map(tags => tags.map(tag => tag.id));
  }

  tagByTagId$(tagId?: string) {
    return this.tags$.map(tags => tags.find(tag => tag.id === tagId));
  }

  tagMetaByTag(tag: Tag) {
    return LiveData.computed(get => {
      return {
        id: tag.id,
        title: get(tag.value$),
        color: get(tag.color$),
        pageCount: get(tag.pageIds$).length,
        createDate: get(tag.createDate$),
        updatedDate: get(tag.updateDate$),
      };
    });
  }

  tagMetas$ = LiveData.computed(get => {
    return get(this.tags$).map(tag => {
      return {
        id: tag.id,
        title: get(tag.value$),
        color: get(tag.color$),
        pageCount: get(tag.pageIds$).length,
        createDate: get(tag.createDate$),
        updatedDate: get(tag.updateDate$),
      };
    });
  });

  private filterFn(value: string, query?: string) {
    const trimmedQuery = query?.trim().toLowerCase() ?? '';
    const trimmedValue = value.trim().toLowerCase();
    return trimmedValue.includes(trimmedQuery);
  }

  filterTagsByName$(name: string) {
    return LiveData.computed(get => {
      return get(this.tags$).filter(tag =>
        this.filterFn(get(tag.value$), name)
      );
    });
  }

  initInternalTags() {
    InternalTags.forEach(tag => {
      if (!this.tagByTagId$(tag.id).getValue()) {
        this.createTagWithId(tag.id, tag.value, tag.color, tag.ghost);
      }
    });
  }
}
