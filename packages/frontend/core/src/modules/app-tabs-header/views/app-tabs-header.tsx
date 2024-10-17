// credits: tab overlay impl inspired by Figma desktop
import {
  type DropTargetDropEvent,
  type DropTargetOptions,
  IconButton,
  Loading,
  useDraggable,
  useDropTarget,
} from '@affine/component';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { useCatchEventCallback } from '@affine/core/components/hooks/use-catch-event-hook';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { apis, events } from '@affine/electron-api';
import { useI18n } from '@affine/i18n';
import { track } from '@affine/track';
import { CloseIcon, PlusIcon, RightSidebarIcon } from '@blocksuite/icons/rc';
import {
  useLiveData,
  useService,
  useServiceOptional,
} from '@toeverything/infra';
import clsx from 'clsx';
import { partition } from 'lodash-es';
import {
  Fragment,
  type MouseEventHandler,
  type ReactNode,
  useEffect,
  useState,
} from 'react';

import { AppSidebarService } from '../../app-sidebar';
import { iconNameToIcon } from '../../workbench/constants';
import { DesktopStateSynchronizer } from '../../workbench/services/desktop-state-synchronizer';
import {
  AppTabsHeaderService,
  type TabStatus,
} from '../services/app-tabs-header-service';
import * as styles from './styles.css';

const TabSupportType = ['collection', 'tag', 'doc'];

const tabCanDrop =
  (tab?: TabStatus): NonNullable<DropTargetOptions<AffineDNDData>['canDrop']> =>
  ctx => {
    if (
      ctx.source.data.from?.at === 'app-header:tabs' &&
      ctx.source.data.from.tabId !== tab?.id
    ) {
      return true;
    }

    if (
      ctx.source.data.entity?.type &&
      TabSupportType.includes(ctx.source.data.entity?.type)
    ) {
      return true;
    }

    return false;
  };

const WorkbenchTab = ({
  workbench,
  active: tabActive,
  tabsLength,
  dnd,
  onDrop,
}: {
  workbench: TabStatus;
  active: boolean;
  tabsLength: number;
  dnd?: boolean;
  onDrop?: (data: DropTargetDropEvent<AffineDNDData>) => void;
}) => {
  useServiceOptional(DesktopStateSynchronizer);
  const tabsHeaderService = useService(AppTabsHeaderService);
  const activeViewIndex = workbench.activeViewIndex ?? 0;
  const onContextMenu = useAsyncCallback(
    async (viewIdx: number) => {
      const action = await tabsHeaderService.showContextMenu?.(
        workbench.id,
        viewIdx
      );
      switch (action?.type) {
        case 'open-in-split-view': {
          track.$.appTabsHeader.$.tabAction({
            control: 'contextMenu',
            action: 'openInSplitView',
          });
          break;
        }
        case 'separate-view': {
          track.$.appTabsHeader.$.tabAction({
            control: 'contextMenu',
            action: 'separateTabs',
          });
          break;
        }
        case 'pin-tab': {
          if (action.payload.shouldPin) {
            track.$.appTabsHeader.$.tabAction({
              control: 'contextMenu',
              action: 'pin',
            });
          } else {
            track.$.appTabsHeader.$.tabAction({
              control: 'contextMenu',
              action: 'unpin',
            });
          }
          break;
        }
        // fixme: when close tab the view may already be gc'ed
        case 'close-tab': {
          track.$.appTabsHeader.$.tabAction({
            control: 'contextMenu',
            action: 'close',
          });
          break;
        }
        default:
          break;
      }
    },
    [tabsHeaderService, workbench.id]
  );
  const onActivateView = useAsyncCallback(
    async (viewIdx: number) => {
      if (viewIdx === activeViewIndex && tabActive) {
        return;
      }
      await tabsHeaderService.activateView?.(workbench.id, viewIdx);
      if (tabActive) {
        track.$.appTabsHeader.$.tabAction({
          control: 'click',
          action: 'switchSplitView',
        });
      } else {
        track.$.appTabsHeader.$.tabAction({
          control: 'click',
          action: 'switchTab',
        });
      }
    },
    [activeViewIndex, tabActive, tabsHeaderService, workbench.id]
  );
  const handleAuxClick: MouseEventHandler = useCatchEventCallback(
    async e => {
      if (e.button === 1) {
        await tabsHeaderService.closeTab?.(workbench.id);
        track.$.appTabsHeader.$.tabAction({
          control: 'midClick',
          action: 'close',
        });
      }
    },
    [tabsHeaderService, workbench.id]
  );

  const handleCloseTab = useCatchEventCallback(async () => {
    await tabsHeaderService.closeTab?.(workbench.id);
    track.$.appTabsHeader.$.tabAction({
      control: 'xButton',
      action: 'close',
    });
  }, [tabsHeaderService, workbench.id]);

  const { dropTargetRef, closestEdge } = useDropTarget<AffineDNDData>(
    () => ({
      closestEdge: {
        allowedEdges: ['left', 'right'],
      },
      onDrop,
      dropEffect: 'move',
      canDrop: tabCanDrop(workbench),
      isSticky: true,
    }),
    [onDrop, workbench]
  );

  const { dragRef } = useDraggable<AffineDNDData>(
    () => ({
      canDrag: dnd,
      data: {
        from: {
          at: 'app-header:tabs',
          tabId: workbench.id,
        },
      },
      dragPreviewPosition: 'pointer-outside',
    }),
    [dnd, workbench.id]
  );

  return (
    <div
      className={styles.tabWrapper}
      ref={node => {
        dropTargetRef.current = node;
        dragRef.current = node;
      }}
    >
      <div
        key={workbench.id}
        data-testid="workbench-tab"
        data-active={tabActive}
        data-pinned={workbench.pinned}
        className={styles.tab}
      >
        {workbench.views.map((view, viewIdx) => {
          return (
            <Fragment key={view.id}>
              <button
                key={view.id}
                data-testid="split-view-label"
                className={styles.splitViewLabel}
                data-active={activeViewIndex === viewIdx && tabActive}
                onContextMenu={() => {
                  onContextMenu(viewIdx);
                }}
                onAuxClick={handleAuxClick}
                onClick={e => {
                  e.stopPropagation();
                  onActivateView(viewIdx);
                }}
              >
                <div className={styles.labelIcon}>
                  {workbench.ready || !workbench.loaded ? (
                    iconNameToIcon[view.iconName ?? 'allDocs']
                  ) : (
                    <Loading />
                  )}
                </div>
                {!view.title ? null : (
                  <div
                    title={view.title}
                    className={styles.splitViewLabelText}
                    data-padding-right={tabsLength > 1 && !workbench.pinned}
                  >
                    {view.title}
                  </div>
                )}
              </button>

              {viewIdx !== workbench.views.length - 1 ? (
                <div className={styles.splitViewSeparator} />
              ) : null}
            </Fragment>
          );
        })}
        <div className={styles.tabCloseButtonWrapper}>
          {tabsLength > 1 && !workbench.pinned ? (
            <button
              data-testid="close-tab-button"
              className={styles.tabCloseButton}
              onClick={handleCloseTab}
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>
      </div>
      <div className={styles.dropIndicator} data-edge={closestEdge} />
    </div>
  );
};

const useIsFullScreen = () => {
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    apis?.ui
      .isFullScreen()
      .then(setFullScreen)
      .then(() => {
        events?.ui.onFullScreen(setFullScreen);
      })
      .catch(console.error);
  }, []);
  return fullScreen;
};

export const AppTabsHeader = ({
  style,
  mode = 'app',
  className,
  left,
}: {
  style?: React.CSSProperties;
  mode?: 'app' | 'shell';
  className?: string;
  left?: ReactNode;
}) => {
  const t = useI18n();
  const appSidebarService = useService(AppSidebarService).sidebar;
  const sidebarWidth = useLiveData(appSidebarService.width$);
  const sidebarOpen = useLiveData(appSidebarService.open$);
  const sidebarResizing = useLiveData(appSidebarService.resizing$);

  const isMacosDesktop = BUILD_CONFIG.isElectron && environment.isMacOs;
  const isWindowsDesktop = BUILD_CONFIG.isElectron && environment.isWindows;
  const fullScreen = useIsFullScreen();

  const tabsHeaderService = useService(AppTabsHeaderService);
  const tabs = useLiveData(tabsHeaderService.tabsStatus$);

  const [pinned, unpinned] = partition(tabs, tab => tab.pinned);

  const onAddTab = useAsyncCallback(async () => {
    await tabsHeaderService.onAddTab?.();
    track.$.appTabsHeader.$.tabAction({
      control: 'click',
      action: 'openInNewTab',
    });
  }, [tabsHeaderService]);

  const onToggleRightSidebar = useAsyncCallback(async () => {
    await tabsHeaderService.onToggleRightSidebar?.();
  }, [tabsHeaderService]);

  useEffect(() => {
    if (mode === 'app') {
      apis?.ui.pingAppLayoutReady().catch(console.error);
    }
  }, [mode]);

  const onDrop = useAsyncCallback(
    async (data: DropTargetDropEvent<AffineDNDData>, targetId?: string) => {
      const edge = data.closestEdge ?? 'right';
      targetId = targetId ?? tabs.at(-1)?.id;

      if (!targetId || edge === 'top' || edge === 'bottom') {
        return;
      }

      if (data.source.data.from?.at === 'app-header:tabs') {
        if (targetId === data.source.data.from.tabId) {
          return;
        }
        track.$.appTabsHeader.$.tabAction({
          control: 'dnd',
          action: 'moveTab',
        });
        return await tabsHeaderService.moveTab?.(
          data.source.data.from.tabId,
          targetId,
          edge
        );
      }

      if (data.source.data.entity?.type === 'doc') {
        track.$.appTabsHeader.$.tabAction({
          control: 'dnd',
          action: 'openInNewTab',
          type: 'doc',
        });
        return await tabsHeaderService.onAddDocTab?.(
          data.source.data.entity.id,
          targetId,
          edge
        );
      }

      if (data.source.data.entity?.type === 'tag') {
        track.$.appTabsHeader.$.tabAction({
          type: 'tag',
          control: 'dnd',
          action: 'openInNewTab',
        });
        return await tabsHeaderService.onAddTagTab?.(
          data.source.data.entity.id,
          targetId,
          edge
        );
      }

      if (data.source.data.entity?.type === 'collection') {
        track.$.appTabsHeader.$.tabAction({
          type: 'collection',
          control: 'dnd',
          action: 'openInNewTab',
        });
        return await tabsHeaderService.onAddCollectionTab?.(
          data.source.data.entity.id,
          targetId,
          edge
        );
      }
    },
    [tabs, tabsHeaderService]
  );

  const { dropTargetRef: spacerDropTargetRef, draggedOver } =
    useDropTarget<AffineDNDData>(
      () => ({
        onDrop,
        dropEffect: 'move',
        canDrop: tabCanDrop(),
      }),
      [onDrop]
    );

  const trafficLightOffset = isMacosDesktop && !fullScreen ? 70 : 0;

  return (
    <div
      className={clsx(styles.root, className)}
      style={style}
      data-mode={mode}
      data-is-windows={isWindowsDesktop}
    >
      <div
        style={{
          transition: sidebarResizing ? 'none' : undefined,
          paddingLeft: 12 + trafficLightOffset,
          width: sidebarOpen ? sidebarWidth : 120 + trafficLightOffset,
          // minus 16 to account for the padding on the right side of the header (for box shadow)
          marginRight: sidebarOpen ? -16 : 0,
        }}
        className={styles.headerLeft}
      >
        {left}
      </div>
      <div className={styles.tabs}>
        {pinned.map(tab => {
          return (
            <WorkbenchTab
              dnd={mode === 'app'}
              tabsLength={pinned.length}
              key={tab.id}
              workbench={tab}
              onDrop={data => onDrop(data, tab.id)}
              active={tab.active}
            />
          );
        })}
        {pinned.length > 0 && unpinned.length > 0 && (
          <div className={styles.pinSeparator} />
        )}
        {unpinned.map(tab => {
          return (
            <WorkbenchTab
              dnd={mode === 'app'}
              tabsLength={tabs.length}
              key={tab.id}
              workbench={tab}
              onDrop={data => onDrop(data, tab.id)}
              active={tab.active}
            />
          );
        })}
      </div>
      <div
        className={styles.spacer}
        ref={spacerDropTargetRef}
        data-dragged-over={draggedOver}
      >
        <IconButton
          size={22.86}
          onClick={onAddTab}
          tooltip={t['com.affine.multi-tab.new-tab']()}
          tooltipShortcut={['$mod', 'T']}
          data-testid="add-tab-view-button"
          style={{ width: 32, height: 32 }}
          icon={<PlusIcon />}
        />
      </div>
      <IconButton size="24" onClick={onToggleRightSidebar}>
        <RightSidebarIcon />
      </IconButton>
      {isWindowsDesktop && (
        <div className={styles.windowsAppControlsPlaceholder} />
      )}
    </div>
  );
};
