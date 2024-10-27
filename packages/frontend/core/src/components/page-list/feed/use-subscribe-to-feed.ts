import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import type { FeedRecord } from '@affine/core/modules/feeds/views/data-hooks';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

export const useSubscribeToFeed = () => {
  const feedsService = useService(FeedsService);
  const currentFolder = useLiveData(feedsService.searchModal.currentFolder$);
  return useCallback(
    (feedRecord: FeedRecord) => {
      let folder = feedsService.feedTree.rootFolder;
      if (currentFolder?.folderId) {
        const currFolderNode = feedsService.feedTree.folderNodeById(
          currentFolder?.folderId
        );
        if (currFolderNode) {
          folder = currFolderNode;
        }
      }

      // if the feed is already added, do nothing
      if (feedsService.feedTree.feedNodeByUrl(feedRecord.url)) {
        return;
      }

      folder.createFeed(
        feedRecord.id,
        feedRecord.name,
        feedRecord.url,
        feedRecord.description,
        feedRecord.icon
      );
      return;
    },
    [currentFolder, feedsService]
  );
};
