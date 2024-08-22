import { toast } from '@affine/component';
import {
  pushGlobalLoadingEventAtom,
  resolveGlobalLoadingEventAtom,
} from '@affine/component/global-loading';
import { useRegisterNewFeedCommands } from '@affine/core/hooks/use-register-new-feed-commands';
import { NewFeedModalComponent } from '@affine/core/modules/subscription/subscribe-feed/views';
import { useI18n } from '@affine/i18n';
import { ZipTransformer } from '@blocksuite/blocks';
import {
  type DocMode,
  DocsService,
  effect,
  fromPromise,
  LiveData,
  onStart,
  throwIfAborted,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import { useAtomValue, useSetAtom } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import {
  catchError,
  EMPTY,
  finalize,
  mergeMap,
  switchMap,
  timeout,
} from 'rxjs';
import { Map as YMap } from 'yjs';

import { AIProvider } from '../blocksuite/presets/ai';
import { WorkspaceAIOnboarding } from '../components/affine/ai-onboarding';
import { AppContainer } from '../components/affine/app-container';
import { SyncAwareness } from '../components/affine/awareness';
import {
  appSidebarResizingAtom,
  SidebarSwitch,
} from '../components/app-sidebar';
import { AIIsland } from '../components/pure/ai-island';
import { RootAppSidebar } from '../components/root-app-sidebar';
import { MainContainer } from '../components/workspace';
import { WorkspaceUpgrade } from '../components/workspace-upgrade';
import { useRegisterFindInPageCommands } from '../hooks/affine/use-register-find-in-page-commands';
import { useSubscriptionNotifyReader } from '../hooks/affine/use-subscription-notify';
import { useRegisterWorkspaceCommands } from '../hooks/use-register-workspace-commands';
import { AppTabsHeader } from '../modules/app-tabs-header';
import { NavigationButtons } from '../modules/navigation';
import { useRegisterNavigationCommands } from '../modules/navigation/view/use-register-navigation-commands';
import { QuickSearchContainer } from '../modules/quicksearch';
import { WorkbenchService } from '../modules/workbench';
import {
  AllWorkspaceModals,
  CurrentWorkspaceModals,
} from '../providers/modal-provider';
import { SWRConfigProvider } from '../providers/swr-config-provider';
import * as styles from './styles.css';

export const WorkspaceLayout = function WorkspaceLayout({
  children,
}: PropsWithChildren) {
  return (
    <SWRConfigProvider>
      {/* load all workspaces is costly, do not block the whole UI */}
      <AllWorkspaceModals />
      <CurrentWorkspaceModals />
      <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
      {/* should show after workspace loaded */}
      <WorkspaceAIOnboarding />
      <AIIsland />
    </SWRConfigProvider>
  );
};

const WorkspaceLayoutProviders = ({ children }: PropsWithChildren) => {
  const t = useI18n();
  const pushGlobalLoadingEvent = useSetAtom(pushGlobalLoadingEventAtom);
  const resolveGlobalLoadingEvent = useSetAtom(resolveGlobalLoadingEventAtom);
  const currentWorkspace = useService(WorkspaceService).workspace;
  const docsList = useService(DocsService).list;

  const workbench = useService(WorkbenchService).workbench;
  useEffect(() => {
    const insertTemplate = effect(
      switchMap(({ template, mode }: { template: string; mode: string }) => {
        return fromPromise(async abort => {
          const templateZip = await fetch(template, { signal: abort });
          const templateBlob = await templateZip.blob();
          throwIfAborted(abort);
          const [doc] = await ZipTransformer.importDocs(
            currentWorkspace.docCollection,
            templateBlob
          );
          if (doc) {
            doc.resetHistory();
          }

          return { doc, mode };
        }).pipe(
          timeout(10000 /* 10s */),
          mergeMap(({ mode, doc }) => {
            if (doc) {
              docsList.setMode(doc.id, mode as DocMode);
              workbench.openDoc(doc.id);
            }
            return EMPTY;
          }),
          onStart(() => {
            pushGlobalLoadingEvent({
              key: 'insert-template',
            });
          }),
          catchError(err => {
            console.error(err);
            toast(t['com.affine.ai.template-insert.failed']());
            return EMPTY;
          }),
          finalize(() => {
            resolveGlobalLoadingEvent('insert-template');
          })
        );
      })
    );

    const disposable = AIProvider.slots.requestInsertTemplate.on(
      ({ template, mode }) => {
        insertTemplate({ template, mode });
      }
    );
    return () => {
      disposable.dispose();
      insertTemplate.unsubscribe();
    };
  }, [
    currentWorkspace.docCollection,
    docsList,
    pushGlobalLoadingEvent,
    resolveGlobalLoadingEvent,
    t,
    workbench,
  ]);

  useSubscriptionNotifyReader();
  useRegisterWorkspaceCommands();
  useRegisterNavigationCommands();
  useRegisterFindInPageCommands();
  useRegisterNewFeedCommands();
  // usePullFeedItemsInterval();

  useEffect(() => {
    // hotfix for blockVersions
    // this is a mistake in the
    //    0.8.0 ~ 0.8.1
    //    0.8.0-beta.0 ~ 0.8.0-beta.3
    //    0.8.0-canary.17 ~ 0.9.0-canary.3
    const meta = currentWorkspace.docCollection.doc.getMap('meta');
    const blockVersions = meta.get('blockVersions');
    if (
      !(blockVersions instanceof YMap) &&
      blockVersions !== null &&
      blockVersions !== undefined &&
      typeof blockVersions === 'object'
    ) {
      meta.set(
        'blockVersions',
        new YMap(Object.entries(blockVersions as Record<string, number>))
      );
    }
  }, [currentWorkspace.docCollection.doc]);

  return (
    <>
      {/* This DndContext is used for drag page from all-pages list into a folder in sidebar */}
      {children}
      <QuickSearchContainer />
      <NewFeedModalComponent />
      <SyncAwareness />
    </>
  );
};

const DesktopLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className={styles.desktopAppViewContainer}>
      <div className={styles.desktopTabsHeader}>
        <AppTabsHeader
          left={
            <>
              <SidebarSwitch show />
              <NavigationButtons />
            </>
          }
        />
      </div>
      <div className={styles.desktopAppViewMain}>
        <RootAppSidebar />
        <MainContainer>{children}</MainContainer>
      </div>
    </div>
  );
};

const BrowserLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className={styles.browserAppViewContainer}>
      <RootAppSidebar />
      <MainContainer>{children}</MainContainer>
    </div>
  );
};

/**
 * Wraps the workspace layout main router view
 */
const WorkspaceLayoutUIContainer = ({ children }: PropsWithChildren) => {
  const workbench = useService(WorkbenchService).workbench;
  const currentPath = useLiveData(
    LiveData.computed(get => {
      return get(workbench.basename$) + get(workbench.location$).pathname;
    })
  );

  const resizing = useAtomValue(appSidebarResizingAtom);
  const LayoutComponent = environment.isDesktop ? DesktopLayout : BrowserLayout;

  return (
    <AppContainer data-current-path={currentPath} resizing={resizing}>
      <LayoutComponent>{children}</LayoutComponent>
    </AppContainer>
  );
};
export const WorkspaceLayoutInner = ({ children }: PropsWithChildren) => {
  const currentWorkspace = useService(WorkspaceService).workspace;

  const upgrading = useLiveData(currentWorkspace.upgrade.upgrading$);
  const needUpgrade = useLiveData(currentWorkspace.upgrade.needUpgrade$);

  return (
    <WorkspaceLayoutProviders>
      <WorkspaceLayoutUIContainer>
        {needUpgrade || upgrading ? <WorkspaceUpgrade /> : children}
      </WorkspaceLayoutUIContainer>
    </WorkspaceLayoutProviders>
  );
};
