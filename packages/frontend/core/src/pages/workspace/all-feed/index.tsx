import { type CollectionMeta } from '@affine/core/components/page-list';
import {
  FeedListHeader,
  VirtualizedFeedList,
} from '@affine/core/components/page-list/feeds';
import { NewFeedService } from '@affine/core/modules/feed/new-feed';
import { FeedService } from '@affine/core/modules/feed/services/feed';
import { mixpanel } from '@affine/core/utils';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useMemo, useState } from 'react';

import { ViewBodyIsland, ViewHeaderIsland } from '../../../modules/workbench';
import { EmptyFeedList } from '../page-list-empty-feed';
import { AllFeedHeader } from './header';
import * as styles from './index.css';

export const AllCollection = () => {
  const [hideHeaderCreateNew, setHideHeaderCreateNew] = useState(true);

  const feedService = useService(FeedService);
  const feeds = useLiveData(feedService.feeds$);
  const feedMetas = useMemo(() => {
    const collectionsList: CollectionMeta[] = feeds.map(collection => {
      return {
        ...collection,
        title: collection.name,
      };
    });
    return collectionsList;
  }, [feeds]);
  const newFeed = useService(NewFeedService).newFeed;
  const handleOpenNewFeedModal = useCallback(() => {
    newFeed.show();
    mixpanel.track('NewOpened', {
      segment: 'navigation panel',
      control: 'new feed button',
    });
  }, [newFeed]);
  return (
    <>
      <ViewHeaderIsland>
        <AllFeedHeader
          showCreateNew={!hideHeaderCreateNew}
          handleCreateFeed={handleOpenNewFeedModal}
        />
      </ViewHeaderIsland>
      <ViewBodyIsland>
        <div className={styles.body}>
          {feedMetas.length > 0 ? (
            <VirtualizedFeedList
              collections={feeds}
              collectionMetas={feedMetas}
              setHideHeaderCreateNewFeed={setHideHeaderCreateNew}
              handleCreateFeed={handleOpenNewFeedModal}
            />
          ) : (
            <EmptyFeedList
              heading={<FeedListHeader onCreate={handleOpenNewFeedModal} />}
            />
          )}
        </div>
      </ViewBodyIsland>
    </>
  );
};

export const Component = () => {
  return <AllCollection />;
};
