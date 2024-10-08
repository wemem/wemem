import { MenuIcon, MenuItem, MenuSeparator, toast } from '@affine/component';
import { useAppSettingHelper } from '@affine/core/hooks/affine/use-app-setting-helper';
import { track } from '@affine/core/mixpanel';
import { FeedsService } from '@affine/core/modules/feed/services/feeds-service';
import { WorkbenchService } from '@affine/core/modules/workbench';
import { useI18n } from '@affine/i18n';
import { DeleteIcon, OpenInNewIcon, SplitViewIcon } from '@blocksuite/icons/rc';
import { useServices } from '@toeverything/infra';
import { useCallback, useMemo } from 'react';

import type { NodeOperation } from '../../tree/types';

export const useExplorerFeedNodeOperations = (
  feedId: string
): NodeOperation[] => {
  const t = useI18n();
  const { appSettings } = useAppSettingHelper();
  const { workbenchService, feedsService } = useServices({
    WorkbenchService,
    FeedsService,
  });

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
          <MenuItem
            preFix={
              <MenuIcon>
                <OpenInNewIcon />
              </MenuIcon>
            }
            onClick={handleOpenInNewTab}
          >
            {t['com.affine.workbench.tab.page-menu-open']()}
          </MenuItem>
        ),
      },
      ...(appSettings.enableMultiView
        ? [
            {
              index: 100,
              view: (
                <MenuItem
                  preFix={
                    <MenuIcon>
                      <SplitViewIcon />
                    </MenuIcon>
                  }
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
            preFix={
              <MenuIcon>
                <DeleteIcon />
              </MenuIcon>
            }
            onClick={handleMoveToTrash}
          >
            {t['Delete']()}
          </MenuItem>
        ),
      },
    ],
    [
      appSettings.enableMultiView,
      handleMoveToTrash,
      handleOpenInNewTab,
      handleOpenInSplitView,
      t,
    ]
  );
};
