import { FeedService } from '@affine/core/modules/feed/services/feed';
import { TagService } from '@affine/core/modules/tag';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

export const useDeleteFeed = () => {
  const feedService = useService(FeedService);
  const tagList = useService(TagService).tagList;
  return useCallback((...ids: string[]) => {
    feedService.deleteFeed(...ids);
    ids.map(id => tagList.deleteTag(id));
  }, [feedService, tagList]);
};
