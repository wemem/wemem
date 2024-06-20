import { type CollectionMeta, useCreateFeed } from '@affine/core/components/page-list';
import { FeedListHeader, VirtualizedFeedList } from '@affine/core/components/page-list/feeds';
import { FeedService } from '@affine/core/modules/feed/services/feed';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import { useMemo, useState } from 'react';

import { ViewBodyIsland, ViewHeaderIsland } from '../../../modules/workbench';
import { AllFeedHeader } from './header';
import * as styles from './index.css';
import { EmptyFeedList } from '../page-list-empty-feed';

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
  const { node, handleCreateFeed } = useCreateFeed(useService(WorkspaceService).workspace.docCollection);
  return (
    <>
      <ViewHeaderIsland>
        <AllFeedHeader
          showCreateNew={!hideHeaderCreateNew}
          handleCreateFeed={handleCreateFeed}
        />
      </ViewHeaderIsland>
      <ViewBodyIsland>
        <div className={styles.body}>
          {feedMetas.length > 0 ? (
            <VirtualizedFeedList
              collections={feeds}
              collectionMetas={feedMetas}
              setHideHeaderCreateNewFeed={setHideHeaderCreateNew}
              node={node}
              handleCreateFeed={handleCreateFeed}
            />
          ) : (
            <EmptyFeedList
              heading={
                <FeedListHeader
                  node={node}
                  onCreate={handleCreateFeed}
                />
              }
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
