import { PageDetailSkeleton } from '@affine/component/page-detail-skeleton';
import { ResizePanel } from '@affine/component/resize-panel';
import { FeedsFilterContainer } from '@affine/core/components/feeds-page-list/feeds-page-filter';
import { FeedsPageList } from '@affine/core/components/feeds-page-list/feeds-page-list';
import { useBlockSuiteDocMeta } from '@affine/core/components/hooks/use-block-suite-page-meta';
import { useFilteredPageMetas } from '@affine/core/components/page-list';
import type { FeedNode } from '@affine/core/modules/feeds';
import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import { ReadStatus } from '@affine/core/modules/feeds/types';
import { ViewBody, ViewHeader } from '@affine/core/modules/workbench';
import type { Filter } from '@affine/env/filter';
import { assertExists } from '@blocksuite/affine/global/utils';
import {
  GlobalContextService,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { memo, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { FeedDetailPage } from '../../../../components/feeds-detail-page/feed-detail-page';
import { FeedPageEmpty } from '../../../../components/feeds-detail-page/feed-page-empty';
import { feedSidebarOpen } from '../../../../components/feeds-detail-page/feed-sidebar-switch';
import { PageNotFound } from '../../404';
import { DetailPageWrapper } from '../detail-page/detail-page-wrapper';
import * as styles from './index.css';

const MAX_WIDTH = 745;
const MIN_WIDTH = 256;

export const FeedsSidebarWidthAtom = atomWithStorage(
  'feeds-sidebar-width',
  480 /* px */
);

const AllFeedPage = memo(() => {
  const params = useParams();
  const pageId = params.pageId;
  const feedId = params.feedId as string;
  const feedsService = useService(FeedsService);
  const globalContext = useService(GlobalContextService).globalContext;

  const feed = useLiveData(feedsService.feedById$(feedId));
  const currentWorkspace = useService(WorkspaceService).workspace;
  const docCollection = currentWorkspace.docCollection;
  assertExists(docCollection);

  const pageMetas = useBlockSuiteDocMeta(docCollection);
  const feedFilter = useMemo(() => {
    if (!feed) {
      return;
    }
    switch (params.status) {
      case ReadStatus.READ:
        return {
          source: feed.source as string,
          read: true,
        };
      case ReadStatus.UNREAD:
        return {
          source: feed.source as string,
          read: false,
        };
      default:
        return {
          source: feed.source as string,
        };
    }
  }, [feed, params.status]);

  const filteredPageMetas = useFilteredPageMetas(pageMetas, {
    feedFilter,
  });

  const feedNode = useLiveData(feedsService.feedTree.nodeById$(feedId));

  useEffect(() => {
    if (feedNode) {
      globalContext.feedId.set(feedId);
      globalContext.isFeed.set(true);

      return () => {
        globalContext.feedId.set(null);
        globalContext.isFeed.set(false);
      };
    }
    return;
  }, [feedId, feedNode, globalContext]);

  const [currentFilters, setCurrentFilters] = useState<Filter[]>([]);

  const [open, setOpen] = useAtom(feedSidebarOpen);
  const [width, setWidth] = useAtom(FeedsSidebarWidthAtom);
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
                readStatus={params.status as ReadStatus}
                pageMetas={filteredPageMetas}
                currentFilters={currentFilters}
                onChangeCurrentFilters={setCurrentFilters}
                wrapTo={to => `/feed/${feedId}/${params.status}${to}`}
                feedNode={feedNode as FeedNode}
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

export const Component = () => {
  return <AllFeedPage />;
};
