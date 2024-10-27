import type { MenuItemProps } from '@affine/component';
import { Menu, MenuItem } from '@affine/component';
import { useUnsubscribe } from '@affine/core/components/page-list';
import { FeedsService } from '@affine/core/modules/feeds/services/feeds';
import { WorkbenchService } from '@affine/core/modules/workbench';
import type { Collection } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { DeleteIcon, EditIcon, SplitViewIcon } from '@blocksuite/icons/rc';
import {
  FeatureFlagService,
  useLiveData,
  useService,
} from '@toeverything/infra';
import type { PropsWithChildren, ReactElement } from 'react';
import { useCallback, useMemo } from 'react';

import * as styles from './feed-operations.css';
import { useCreateFeedModal } from './use-create-feed-modal';

export const FeedOperations = ({
  feed,
  openRenameModal,
  children,
}: PropsWithChildren<{
  feed: Collection;
  openRenameModal?: () => void;
}>) => {
  const service = useService(FeedsService);
  const workbench = useService(WorkbenchService).workbench;
  const deleteFeed = useUnsubscribe();
  const t = useI18n();
  const { open: openEditFeedNameModal, node: editNameModal } =
    useCreateFeedModal({
      title: t['ai.wemem.edit-feed.editFeed'](),
    });

  const featureFlagService = useService(FeatureFlagService);

  const enableMultiView = useLiveData(
    featureFlagService.flags.enable_multi_view.$
  );

  const showEditName = useCallback(() => {
    // use openRenameModal if it is in the sidebar feed list
    if (openRenameModal) {
      return openRenameModal();
    }
    openEditFeedNameModal(feed.name)
      .then(name => {
        return service.updateFeed(feed.id, () => ({
          ...feed,
          name,
        }));
      })
      .catch(err => {
        console.error(err);
      });
  }, [openRenameModal, openEditFeedNameModal, feed, service]);

  const openFeedSplitView = useCallback(() => {
    // workbench.openFeed(feed.id, { at: 'tail' });
  }, [feed.id, workbench]);

  const actions = useMemo<
    Array<
      | {
          icon: ReactElement;
          name: string;
          click: () => void;
          type?: MenuItemProps['type'];
          element?: undefined;
        }
      | {
          element: ReactElement;
        }
    >
  >(
    () => [
      {
        icon: <EditIcon />,
        name: t['ai.wemem.feed.menu.rename'](),
        click: showEditName,
      },
      ...(BUILD_CONFIG.isElectron && enableMultiView
        ? [
            {
              icon: <SplitViewIcon />,
              name: t['com.affine.workbench.split-view.page-menu-open'](),
              click: openFeedSplitView,
            },
          ]
        : []),
      {
        element: <div key="divider" className={styles.divider}></div>,
      },
      {
        icon: <DeleteIcon />,
        name: t['Delete'](),
        click: () => {
          deleteFeed(feed.id);
        },
        type: 'danger',
      },
    ],
    [t, showEditName, enableMultiView, openFeedSplitView, deleteFeed, feed.id]
  );
  return (
    <>
      {editNameModal}
      <Menu
        items={
          <div style={{ minWidth: 150 }}>
            {actions.map(action => {
              if (action.element) {
                return action.element;
              }
              return (
                <MenuItem
                  data-testid="feed-option"
                  key={action.name}
                  type={action.type}
                  prefixIcon={action.icon}
                  onClick={action.click}
                >
                  {action.name}
                </MenuItem>
              );
            })}
          </div>
        }
      >
        {children}
      </Menu>
    </>
  );
};
