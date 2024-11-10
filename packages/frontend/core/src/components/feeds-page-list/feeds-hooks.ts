import { FeedsService } from '@affine/core/modules/feeds';
import {
  DocsService,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback, useMemo } from 'react';

import { useNavigateHelper } from '../hooks/use-navigate-helper';
import type {
  DisplayProperties,
  PageDisplayProperties,
  PageGroupByType,
} from '../page-list';
import {
  useDateGroupDefinitions,
  useFavoriteGroupDefinitions,
  useTagGroupDefinitions,
} from '../page-list';

export const useDeepReading = (docId: string) => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const { openPage } = useNavigateHelper();
  return useCallback(() => {
    openPage(currentWorkspace.docCollection.id, docId);
  }, [currentWorkspace.docCollection.id, docId, openPage]);
};

export const useDocReadStatus = (docId: string) => {
  const docRecordList = useService(DocsService).list;
  const feedsService = useService(FeedsService);

  const record = useMemo(
    () => docRecordList.doc$(docId).value,
    [docRecordList, docId]
  );
  const read = useLiveData(record?.read$);
  const feedSource = useLiveData(record?.feedSource$);

  const toggleRead = useCallback(() => {
    if (!record) {
      return;
    }
    if (!feedSource) {
      return;
    }

    const rssNode = feedsService.feedTree.rssNodeBySource(feedSource);
    if (!rssNode) {
      return;
    }

    if (!read) {
      rssNode.incrUnreadCount(-1);
    } else {
      rssNode.incrUnreadCount(1);
    }
    record.toggleRead();
  }, [feedSource, feedsService.feedTree, read, record]);

  return {
    read: Boolean(read),
    toggleRead,
  };
};

export const displayPropertiesAtom = atomWithStorage<{
  [workspaceId: string]: DisplayProperties;
}>('feedsPageListDisplayProperties', {});

const defaultProps: DisplayProperties = {
  groupBy: 'createDate',
  displayProperties: {
    bodyNotes: true,
    tags: true,
    createDate: true,
    updatedDate: true,
  },
};

export const useFeedsPageListDisplayProperties = (): [
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

export const useFeedsPageItemGroupDefinitions = () => {
  const [workspaceProperties] = useFeedsPageListDisplayProperties();
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
