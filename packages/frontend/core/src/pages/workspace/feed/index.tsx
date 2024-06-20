import {
  AffineShapeIcon,
  useEditCollection,
  VirtualizedPageList,
} from '@affine/core/components/page-list';
import { useAllPageListConfig } from '@affine/core/hooks/affine/use-all-page-list-config';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { CollectionService } from '@affine/core/modules/collection';
import { FeedService } from '@affine/core/modules/feed/services/feed';
import { FilterContainer } from '@affine/core/pages/workspace/all-page/all-page-filter';
import type { Collection, Filter } from '@affine/env/filter';
import { Trans } from '@affine/i18n';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import {
  CloseIcon,
  FilterIcon,
  PageIcon,
  ViewLayersIcon,
} from '@blocksuite/icons';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useNavigateHelper } from '../../../hooks/use-navigate-helper';
import { ViewBodyIsland, ViewHeaderIsland } from '../../../modules/workbench';
import * as styles from './feed.css';
import { FeedDetailHeader } from './header';

export const FeedDetail = ({ collection }: { collection: Collection }) => {
  const config = useAllPageListConfig();
  const [filters, setFilters] = useState<Filter[]>([]);
  return (
    <>
      <ViewHeaderIsland>
        <FeedDetailHeader />
      </ViewHeaderIsland>
      <ViewBodyIsland>
        <div className={styles.body}>
          <FilterContainer filters={filters} onChangeFilters={setFilters} />
          <VirtualizedPageList
            feed={collection}
            filters={[...collection.filterList, ...filters]}
            config={config}
          />
        </div>
      </ViewBodyIsland>
    </>
  );
};

export const Component = function CollectionPage() {
  const service = useService(FeedService);
  const feeds = useLiveData(service.feeds$);
  const params = useParams();
  const feed = feeds.find(v => v.id === params.feedId);

  if (!feed) {
    return null;
  }
  return isEmpty(feed) ? (
    <Placeholder collection={feed} />
  ) : (
    <FeedDetail collection={feed} />
  );
};

const Placeholder = ({ collection }: { collection: Collection }) => {
  const workspace = useService(WorkspaceService).workspace;
  const collectionService = useService(CollectionService);
  const { node, open } = useEditCollection(useAllPageListConfig());
  const { jumpToCollections } = useNavigateHelper();
  const openPageEdit = useAsyncCallback(async () => {
    const ret = await open({ ...collection }, 'page');
    collectionService.updateCollection(ret.id, () => ret);
  }, [open, collection, collectionService]);
  const openRuleEdit = useAsyncCallback(async () => {
    const ret = await open({ ...collection }, 'rule');
    collectionService.updateCollection(ret.id, () => ret);
  }, [collection, open, collectionService]);
  const [showTips, setShowTips] = useState(false);
  useEffect(() => {
    setShowTips(!localStorage.getItem('hide-empty-collection-help-info'));
  }, []);
  const hideTips = useCallback(() => {
    setShowTips(false);
    localStorage.setItem('hide-empty-collection-help-info', 'true');
  }, []);
  const t = useAFFiNEI18N();

  const handleJumpToCollections = useCallback(() => {
    jumpToCollections(workspace.id);
  }, [jumpToCollections, workspace]);

  return (
    <>
      <ViewHeaderIsland>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 'var(--affine-font-xs)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              color: 'var(--affine-text-secondary-color)',
              ['WebkitAppRegion' as string]: 'no-drag',
            }}
            onClick={handleJumpToCollections}
          >
            <ViewLayersIcon
              style={{ color: 'var(--affine-icon-color)' }}
              fontSize={14}
            />
            {t['ai.readflow.feeds.allFeeds']()}
            <div>/</div>
          </div>
          <div
            data-testid="feed-name"
            style={{
              fontWeight: 600,
              color: 'var(--affine-text-primary-color)',
              ['WebkitAppRegion' as string]: 'no-drag',
            }}
          >
            {collection.name}
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </ViewHeaderIsland>
      <ViewBodyIsland>
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            gap: 64,
          }}
        >
          <div
            style={{
              maxWidth: 432,
              marginTop: 118,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
              margin: '118px 12px 0',
            }}
          >
            <AffineShapeIcon />
            <div
              style={{
                fontSize: 20,
                lineHeight: '28px',
                fontWeight: 600,
                color: 'var(--affine-text-primary-color)',
              }}
            >
              {t['com.affine.collection.emptyCollection']()}
            </div>
            <div
              style={{
                fontSize: 12,
                lineHeight: '20px',
                color: 'var(--affine-text-secondary-color)',
                textAlign: 'center',
              }}
            >
              {t['com.affine.collection.emptyCollectionDescription']()}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px 32px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <div onClick={openPageEdit} className={styles.placeholderButton}>
                <PageIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: 'var(--affine-icon-color)',
                  }}
                />
                <span style={{ padding: '0 4px' }}>
                  {t['com.affine.collection.addPages']()}
                </span>
              </div>
              <div onClick={openRuleEdit} className={styles.placeholderButton}>
                <FilterIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: 'var(--affine-icon-color)',
                  }}
                />
                <span style={{ padding: '0 4px' }}>
                  {t['com.affine.collection.addRules']()}
                </span>
              </div>
            </div>
          </div>
          {showTips ? (
            <div
              style={{
                maxWidth: 452,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--affine-background-overlay-panel-color)',
                padding: 10,
                gap: 14,
                margin: '0 12px',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  lineHeight: '20px',
                  color: 'var(--affine-text-secondary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>{t['com.affine.collection.helpInfo']()}</div>
                <CloseIcon
                  className={styles.button}
                  style={{ width: 16, height: 16 }}
                  onClick={hideTips}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontSize: 12,
                  lineHeight: '20px',
                }}
              >
                <div>
                  <Trans i18nKey="com.affine.collection.addPages.tips">
                    <span style={{ fontWeight: 600 }}>Add pages:</span> You can
                    freely select pages and add them to the collection.
                  </Trans>
                </div>
                <div>
                  <Trans i18nKey="com.affine.collection.addRules.tips">
                    <span style={{ fontWeight: 600 }}>Add rules:</span> Rules
                    are based on filtering. After adding rules, pages that meet
                    the requirements will be automatically added to the current
                    collection.
                  </Trans>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </ViewBodyIsland>
      {node}
    </>
  );
};

const isEmpty = (collection: Collection) => {
  return (
    collection.allowList.length === 0 && collection.filterList.length === 0
  );
};
