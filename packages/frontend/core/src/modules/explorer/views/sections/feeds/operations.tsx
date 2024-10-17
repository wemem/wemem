import { MenuItem, MenuSeparator, toast } from '@affine/component';
import { FeedsService } from '@affine/core/modules/feed/services/feeds-service';
import { WorkbenchService } from '@affine/core/modules/workbench';
import { useI18n } from '@affine/i18n';
import { track } from '@affine/track';
import { DeleteIcon, OpenInNewIcon, SplitViewIcon } from '@blocksuite/icons/rc';
import {
  FeatureFlagService,
  useLiveData,
  useServices,
} from '@toeverything/infra';
import { useCallback, useMemo } from 'react';

import type { NodeOperation } from '../../tree/types';

export const useExplorerFeedNodeOperations = (
  feedId: string
): NodeOperation[] => {
  const t = useI18n();
  const { workbenchService, feedsService, featureFlagService } = useServices({
    WorkbenchService,
    FeedsService,
    FeatureFlagService,
  });

  const enableMultiView = useLiveData(
    featureFlagService.flags.enable_multi_view.$
  );

  const handleMoveToTrash = useCallback(() => {
    feedsService.unsubscribe(feedId);
    track.$.navigationPanel.organize.deleteOrganizeItem({ type: 'tag' });
    toast(t['ai.wemem.feeds.delete.toast']());
  }, [feedsService, feedId, t]);

  const handleOpenInSplitView = useCallback(() => {
    workbenchService.workbench.openTag(feedId, {
      at: 'beside',
    });
    track.$.navigationPanel.organize.openInSplitView({ type: 'tag' });
  }, [feedId, workbenchService]);

  const handleOpenInNewTab = useCallback(() => {
    workbenchService.workbench.openFeed(feedId, 'unseen', {
      at: 'new-tab',
    });
    track.$.navigationPanel.organize.openInNewTab({ type: 'tag' });
  }, [feedId, workbenchService]);

  return useMemo(
    () => [
      {
        index: 50,
        view: (
          <MenuItem prefixIcon={<OpenInNewIcon />} onClick={handleOpenInNewTab}>
            {t['com.affine.workbench.tab.page-menu-open']()}
          </MenuItem>
        ),
      },
      ...(BUILD_CONFIG.isElectron && enableMultiView
        ? [
            {
              index: 100,
              view: (
                <MenuItem
                  prefixIcon={<SplitViewIcon />}
                  onClick={handleOpenInSplitView}
                >
                  {t['com.affine.workbench.split-view.page-menu-open']()}
                </MenuItem>
              ),
            },
          ]
        : []),
      {
        index: 9999,
        view: <MenuSeparator key="menu-separator" />,
      },
      {
        index: 10000,
        view: (
          <MenuItem
            type={'danger'}
            prefixIcon={<DeleteIcon />}
            onClick={handleMoveToTrash}
          >
            {t['Delete']()}
          </MenuItem>
        ),
      },
    ],
    [
      enableMultiView,
      handleMoveToTrash,
      handleOpenInNewTab,
      handleOpenInSplitView,
      t,
    ]
  );
};
