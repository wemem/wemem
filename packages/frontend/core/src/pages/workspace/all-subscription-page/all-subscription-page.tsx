import { ResizePanel } from '@affine/component/resize-panel';
import { SubscriptionFilterContainer } from '@affine/core/components/page-list/subscription-page-list/subscription-page-filter';
import { SubscriptionPageList } from '@affine/core/components/page-list/subscription-page-list/subscription-page-list';
import {
  SeenTag,
  SubscriptionTag,
  UnseenTag,
} from '@affine/core/modules/tag/entities/internal-tag';
import type { Filter } from '@affine/env/filter';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ViewBody, ViewHeader } from '../../../modules/workbench';
import * as styles from './index.css';
import { EmptySubscriptionPage } from './page-subscription-empty';
import { SubscriptionDetailPage } from './subscription-detail-page';
import { subscriptionSidebarOpen } from './subscription-sidebar-switch';
import { useLiveData, useService } from '@toeverything/infra';
import { SubscriptionService } from '@affine/core/modules/subscription/services/subscription-service';

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
      value: [SubscriptionTag.id, UnseenTag.id],
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
      value: [SubscriptionTag.id, SeenTag.id],
    },
  ],
};

export const subscriptionSidebarWidthAtom = atomWithStorage(
  'subscription-sidebar-width',
  480 /* px */
);

export const AllSubscriptionPage = () => {
  const params = useParams();
  const pageId = params.pageId;
  const subscriptionId = params.subscriptionId;
  const subscriptionService = useService(SubscriptionService);
  const subscription = useLiveData(
    subscriptionService.subscriptionById$(subscriptionId)
  );

  const filter = useMemo(() => {
    const filter =
      params.status === 'seen'
        ? SubscriptionSeenFilter
        : SubscriptionUnseenFilter;
    if (subscription) {
      return {
        ...filter,
        args: [
          {
            ...filter.args[0],
            value: [
              ...(filter.args[0].value as string[]),
              subscription.subscription?.url,
            ],
          },
        ],
      };
    }
    return filter;
  }, [params.status, subscription]);
  const [currentFilters, setCurrentFilters] = useState<Filter[]>([]);

  const [open, setOpen] = useAtom(subscriptionSidebarOpen);
  const [width, setWidth] = useAtom(subscriptionSidebarWidthAtom);
  const [resizing, setResizing] = useState(false);
  const clientBorder = true;
  const hasRightBorder = true;

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
              <SubscriptionFilterContainer
                filters={currentFilters}
                onChangeFilters={setCurrentFilters}
              />
              <SubscriptionPageList
                filters={[filter, ...currentFilters]}
                feedDocs={true}
                currentFilters={currentFilters}
                onChangeCurrentFilters={setCurrentFilters}
                wrapTo={to => `/subscription/seen/${params.status}${to}`}
              />
            </div>
          </ResizePanel>

          {pageId ? (
            <div className={styles.subcriptionDocDetail}>
              <SubscriptionDetailPage
                docId={pageId}
                key={pageId}
              ></SubscriptionDetailPage>
            </div>
          ) : (
            <EmptySubscriptionPage />
          )}
        </div>
      </ViewBody>
    </>
  );
};
