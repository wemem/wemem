import { PageDetailSkeleton } from '@affine/component/page-detail-skeleton';
import { ResizePanel } from '@affine/component/resize-panel';
import { FeedsFilterContainer } from '@affine/core/components/page-list/feeds-page-list/feeds-page-filter';
import { FeedsPageList } from '@affine/core/components/page-list/feeds-page-list/feeds-page-list';
import { FeedsService } from '@affine/core/modules/feed/services/feeds-service';
import {
  FeedTag,
  SeenTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import { ViewBody, ViewHeader } from '@affine/core/modules/workbench';
import type { Filter } from '@affine/env/filter';
import {
  GlobalContextService,
  useLiveData,
  useService,
} from '@toeverything/infra';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { memo, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { PageNotFound } from '../../404';
import { DetailPageWrapper } from '../detail-page/detail-page-wrapper';
import { FeedDetailPage } from './feed-detail-page';
import { FeedPageEmpty } from './feed-page-empty';
import { feedSidebarOpen } from './feed-sidebar-switch';
import * as styles from './index.css';

const MAX_WIDTH = 745;
const MIN_WIDTH = 256;

export const SubscriptionUnseenFilter: Filter = {
  type: 'filter',
  left: {
    type: 'ref',
    name: 'Tags',
  },
  funcName: 'contains all',
  args: [
    {
      type: 'literal',
      value: [FeedTag.id, UnseenTag.id],
    },
  ],
};

const SubscriptionSeenFilter: Filter = {
  type: 'filter',
  left: {
    type: 'ref',
    name: 'Tags',
  },
  funcName: 'contains all',
  args: [
    {
      type: 'literal',
      value: [FeedTag.id, SeenTag.id],
    },
  ],
};

export const subscriptionSidebarWidthAtom = atomWithStorage(
  'subscription-sidebar-width',
  480 /* px */
);

export const AllFeedsPage = memo(() => {
  const params = useParams();
  const pageId = params.pageId;
  const feedId = params.feedId;
  const feedsService = useService(FeedsService);
  const globalContext = useService(GlobalContextService).globalContext;
  const feed = useLiveData(feedsService.feedById$(feedId));

  useEffect(() => {
    if (feed) {
      globalContext.feedId.set(feed.id);
      globalContext.isFeed.set(true);

      return () => {
        globalContext.feedId.set(null);
        globalContext.isFeed.set(false);
      };
    }
    return;
  }, [feed, globalContext]);

  const filter = useMemo(() => {
    const filter =
      params.status === 'seen'
        ? SubscriptionSeenFilter
        : SubscriptionUnseenFilter;
    if (feed) {
      return {
        ...filter,
        args: [
          {
            ...filter.args[0],
            value: [...(filter.args[0].value as string[]), feed.feed?.url],
          },
        ],
      };
    }
    return filter;
  }, [params.status, feed]);
  const [currentFilters, setCurrentFilters] = useState<Filter[]>([]);

  const [open, setOpen] = useAtom(feedSidebarOpen);
  const [width, setWidth] = useAtom(subscriptionSidebarWidthAtom);
  const [resizing, setResizing] = useState(false);
  const clientBorder = true;
  const hasRightBorder = true;

  // open sidebar when subscriptionId changes
  useEffect(() => {
    setOpen(true);
  }, [setOpen, feedId]);

  return (
    <>
      <ViewHeader />
      <ViewBody>
        <div className={styles.body}>
          <ResizePanel
            open={open}
            resizing={resizing}
            maxWidth={MAX_WIDTH}
            minWidth={MIN_WIDTH}
            width={width}
            resizeHandlePos="right"
            onOpen={setOpen}
            onResizing={setResizing}
            onWidthChange={setWidth}
            className={styles.PageListWrapperStyle}
            resizeHandleOffset={clientBorder ? 8 : 0}
            resizeHandleVerticalPadding={clientBorder ? 16 : 0}
            data-transparent
            data-has-border={hasRightBorder}
          >
            <div className={styles.list}>
              <FeedsFilterContainer
                filters={currentFilters}
                onChangeFilters={setCurrentFilters}
              />
              <FeedsPageList
                filters={[filter, ...currentFilters]}
                currentFilters={currentFilters}
                onChangeCurrentFilters={setCurrentFilters}
                wrapTo={to => `/feed/seen/${params.status}${to}`}
              />
            </div>
          </ResizePanel>

          {pageId ? (
            <div className={styles.subcriptionDocDetail}>
              {/* <FeedDetailPage docId={pageId} key={pageId}></FeedDetailPage> */}
              <DetailPageWrapper
                pageId={pageId}
                skeleton={<PageDetailSkeleton />}
                notFound={<PageNotFound noPermission />}
              >
                <FeedDetailPage />
              </DetailPageWrapper>
            </div>
          ) : (
            <FeedPageEmpty />
          )}
        </div>
      </ViewBody>
    </>
  );
});
