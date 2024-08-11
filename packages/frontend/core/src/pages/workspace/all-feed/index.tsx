import { type CollectionMeta } from '@affine/core/components/page-list';
import {
  FeedListHeader,
  VirtualizedFeedList,
} from '@affine/core/components/page-list/feeds';
import { SubscriptionService } from '@affine/core/modules/subscription/services/subscription-service';
import { SubscriptionsService } from '@affine/core/modules/subscription/subscribe-feed';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useMemo, useState } from 'react';

import { ViewBody, ViewHeader } from '../../../modules/workbench';
import { EmptyFeedList } from '../page-list-empty-feed';
import { AllFeedHeader } from './header';
import * as styles from './index.css';
import { mixpanel } from '@affine/core/mixpanel';

export const AllCollection = () => {
  const [hideHeaderCreateNew, setHideHeaderCreateNew] = useState(true);

  const feedService = useService(SubscriptionService);
  const feeds = useLiveData(feedService.subscriptions$);
  const feedMetas = useMemo(() => {
    const collectionsList: CollectionMeta[] = feeds.map(collection => {
      return {
        ...collection,
        title: collection.name,
      };
    });
    return collectionsList;
  }, [feeds]);
  const subscribeFeed = useService(SubscriptionsService).subscribeFeed;
  const handleOpenNewFeedModal = useCallback(() => {
    subscribeFeed.show();
    mixpanel.track('NewOpened', {
      segment: 'navigation panel',
      control: 'new feed button',
    });
  }, [subscribeFeed]);
  return (
    <>
      <ViewHeader>
        <AllFeedHeader
          showCreateNew={!hideHeaderCreateNew}
          handleCreateFeed={handleOpenNewFeedModal}
        />
      </ViewHeader>
      <ViewBody>
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
      </ViewBody>
    </>
  );
};

export const Component = () => {
  return <AllCollection />;
};
