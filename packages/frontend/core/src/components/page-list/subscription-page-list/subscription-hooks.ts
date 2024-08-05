import { toast } from '@affine/component';
import { useDuplicateDoc } from '@affine/core/hooks/affine/use-duplicate-doc';
import { FavoriteItemsAdapter } from '@affine/core/modules/properties';
import {
  getRefPageId,
  SubscriptionTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import { mixpanel } from '@affine/core/utils';
import { useI18n } from '@affine/i18n';
import type { Doc, DocMeta } from '@blocksuite/store';
import { useService, WorkspaceService } from '@toeverything/infra';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback, useMemo } from 'react';

import {
  useDateGroupDefinitions,
  useFavoriteGroupDefinitions,
  useTagGroupDefinitions,
} from '../group-definitions';
import type {
  DisplayProperties,
  PageDisplayProperties,
  PageGroupByType,
} from '../types';

export const useDeepReading = (page: DocMeta) => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const duplicate = useDuplicateDoc(currentWorkspace.docCollection);

  return useCallback(async () => {
    await duplicate(page.id, true, {
      applyTags: (tags: string[]) => {
        return tags.filter(tag => tag !== SubscriptionTag.id);
      },
    });
    mixpanel.track('DocCreated', {
      segment: 'all doc',
      module: 'doc item menu',
      control: 'copy doc',
      type: 'doc duplicate',
      category: 'doc',
      page: 'doc library',
    });
  }, [duplicate, page.id]);
};

export const useToggleFavoritePage = (page: DocMeta) => {
  const t = useI18n();
  const currentWorkspace = useService(WorkspaceService).workspace;
  const duplicate = useDuplicateDoc(currentWorkspace.docCollection);
  const refPageId = getRefPageId(page.tags) as string;
  const favAdapter = useService(FavoriteItemsAdapter);

  return useCallback(async () => {
    if (!refPageId) {
      const newPage = (await duplicate(page.id, false, {
        applyTags: (tags: string[]) => {
          return tags.filter(tag => tag !== SubscriptionTag.id);
        },
      })) as Doc;
      favAdapter.toggle(newPage.id, 'doc');
      mixpanel.track('DocCreated', {
        segment: 'all doc',
        module: 'doc item menu',
        control: 'copy doc',
        type: 'doc duplicate',
        category: 'doc',
        page: 'doc library',
      });
      toast(t['com.affine.toastMessage.addedFavorites']());
    } else {
      const status = favAdapter.isFavorite(refPageId, 'doc');
      const refPage = currentWorkspace.docCollection.getDoc(refPageId);
      const refPageMeta =
        currentWorkspace.docCollection.meta.getDocMeta(refPageId);
      if (status && refPage && refPageMeta) {
        currentWorkspace.docCollection.removeDoc(refPageId);
      }
      favAdapter.toggle(refPageId, 'doc');
      toast(
        status
          ? t['com.affine.toastMessage.removedFavorites']()
          : t['com.affine.toastMessage.addedFavorites']()
      );
    }
  }, [
    refPageId,
    duplicate,
    page.id,
    favAdapter,
    t,
    currentWorkspace.docCollection,
  ]);
};

export const displayPropertiesAtom = atomWithStorage<{
  [workspaceId: string]: DisplayProperties;
}>('subscriptionPageListDisplayProperties', {});

const defaultProps: DisplayProperties = {
  groupBy: 'createDate',
  displayProperties: {
    bodyNotes: true,
    tags: true,
    createDate: true,
    updatedDate: true,
  },
};

export const useSubscriptionPageListDisplayProperties = (): [
  DisplayProperties,
  (
    key: keyof DisplayProperties,
    value: PageGroupByType | PageDisplayProperties
  ) => void,
] => {
  const workspace = useService(WorkspaceService).workspace;
  const [properties, setProperties] = useAtom(displayPropertiesAtom);

  const workspaceProperties = properties[workspace.id] || defaultProps;

  const onChange = useCallback(
    (
      key: keyof DisplayProperties,
      value: PageGroupByType | PageDisplayProperties
    ) => {
      setProperties(prev => ({
        ...prev,
        [workspace.id]: {
          ...(prev[workspace.id] || defaultProps),
          [key]: value,
        },
      }));
    },
    [setProperties, workspace.id]
  );

  return [workspaceProperties, onChange];
};

export const useSubscriptionPageItemGroupDefinitions = () => {
  const [workspaceProperties] = useSubscriptionPageListDisplayProperties();
  const tagGroupDefinitions = useTagGroupDefinitions();
  const createDateGroupDefinitions = useDateGroupDefinitions('createDate');
  const updatedDateGroupDefinitions = useDateGroupDefinitions('updatedDate');
  const favouriteGroupDefinitions = useFavoriteGroupDefinitions();

  return useMemo(() => {
    const itemGroupDefinitions = {
      createDate: createDateGroupDefinitions,
      updatedDate: updatedDateGroupDefinitions,
      tag: tagGroupDefinitions,
      favourites: favouriteGroupDefinitions,
      none: undefined,

      // add more here later
      // todo(@JimmFly): some page group definitions maybe dynamic
    };
    return itemGroupDefinitions[workspaceProperties.groupBy];
  }, [
    createDateGroupDefinitions,
    favouriteGroupDefinitions,
    tagGroupDefinitions,
    updatedDateGroupDefinitions,
    workspaceProperties.groupBy,
  ]);
};
