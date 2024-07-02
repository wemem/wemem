import { Scrollable } from '@affine/component';
import { PageDetailSkeleton } from '@affine/component/page-detail-skeleton';
import { AIProvider } from '@affine/core/blocksuite/presets/ai';
import { PageAIOnboarding } from '@affine/core/components/affine/ai-onboarding';
import { AIIsland } from '@affine/core/components/pure/ai-island';
import { useAppSettingHelper } from '@affine/core/hooks/affine/use-app-setting-helper';
import { useDocCollectionPage } from '@affine/core/hooks/use-block-suite-workspace-page';
import { type DocSnapshot, Job } from '@blocksuite/store';
import type { Doc } from '@toeverything/infra';
import {
  DocService,
  DocsService,
  FrameworkScope,
  GlobalContextService,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import clsx from 'clsx';
import type { ReactElement } from 'react';
import React, {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';

import { AffineErrorBoundary } from '../../../components/affine/affine-error-boundary';
import { GlobalPageHistoryModal } from '../../../components/affine/page-history-modal';
import { TrashPageFooter } from '../../../components/pure/trash-page-footer';
import { TopTip } from '../../../components/top-tip';
import { useRegisterBlocksuiteEditorCommands } from '../../../hooks/affine/use-register-blocksuite-editor-commands';
import { usePageDocumentTitle } from '../../../hooks/use-global-state';
import {
  MultiTabSidebarBody,
  MultiTabSidebarHeaderSwitcher,
  sidebarTabs,
  type TabOnLoadFn,
} from '../../../modules/multi-tab-sidebar';
import {
  RightSidebarService,
  RightSidebarViewIsland,
} from '../../../modules/right-sidebar';
import {
  useIsActiveView,
  ViewBodyIsland,
  ViewHeaderIsland,
} from '../../../modules/workbench';
import { performanceRenderLogger } from '../../../shared';
import { PageNotFound } from '../../404';
import * as styles from './detail-page.css';
import { DetailPageHeader } from './detail-page-header';

const ReactJson = React.lazy(() => import('react-json-view'));

const DetailPageJsonImpl = memo(function DetailPageImpl() {
  const rightSidebar = useService(RightSidebarService).rightSidebar;
  const activeTabName = useLiveData(rightSidebar.activeTabName$);

  const doc = useService(DocService).doc;
  const workspace = useService(WorkspaceService).workspace;
  const globalContext = useService(GlobalContextService).globalContext;
  const docCollection = workspace.docCollection;
  const mode = useLiveData(doc.mode$);
  const { appSettings } = useAppSettingHelper();
  const [tabOnLoad, setTabOnLoad] = useState<TabOnLoadFn | null>(null);

  const isActiveView = useIsActiveView();

  const setActiveTabName = useCallback(
    (...args: Parameters<typeof rightSidebar.setActiveTabName>) =>
      rightSidebar.setActiveTabName(...args),
    [rightSidebar]
  );

  useEffect(() => {
    const disposable = AIProvider.slots.requestOpenWithChat.on(params => {
      const opened = rightSidebar.isOpen$.value;
      const actived = activeTabName === 'chat';

      if (!opened) {
        rightSidebar.open();
      }
      if (!actived) {
        setActiveTabName('chat');
      }

      // Save chat parameters:
      // * The right sidebar is not open
      // * Chat panel is not activated
      if (!opened || !actived) {
        const callback = AIProvider.genRequestChatCardsFn(params);
        setTabOnLoad(() => callback);
      } else {
        setTabOnLoad(null);
      }
    });
    return () => disposable.dispose();
  }, [activeTabName, rightSidebar, setActiveTabName]);

  useEffect(() => {
    if (isActiveView) {
      globalContext.docId.set(doc.id);

      return () => {
        globalContext.docId.set(null);
      };
    }
    return;
  }, [doc, globalContext, isActiveView]);

  useEffect(() => {
    if (isActiveView) {
      globalContext.docMode.set(mode);

      return () => {
        globalContext.docMode.set(null);
      };
    }
    return;
  }, [doc, globalContext, isActiveView, mode]);

  const isInTrash = useLiveData(doc.meta$.map(meta => meta.trash));
  useRegisterBlocksuiteEditorCommands();
  const title = useLiveData(doc.title$);
  usePageDocumentTitle(title);

  const isWindowsDesktop = environment.isDesktop && environment.isWindows;

  const [snapshot, setSnapshot] = useState<null | DocSnapshot>(null);

  const page = useDocCollectionPage(docCollection, doc.id);
  useEffect(() => {
    if (page) {
      const job = new Job({ collection: page.collection });
      job
        .docToSnapshot(page)
        .then(snapshot => {
          setSnapshot(snapshot);
        })
        .catch(err => {
          console.error('err', err);
        });
    }
  }, [page]);

  return (
    <>
      <ViewHeaderIsland>
        <DetailPageHeader page={doc.blockSuiteDoc} workspace={workspace} />
      </ViewHeaderIsland>
      <ViewBodyIsland>
        <div className={styles.mainContainer}>
          <AIIsland />
          {/* Add a key to force rerender when page changed, to avoid error boundary persisting. */}
          <AffineErrorBoundary key={doc.id}>
            <TopTip pageId={doc.id} workspace={workspace} />
            <Scrollable.Root>
              <Scrollable.Viewport
                className={clsx(
                  'affine-page-viewport',
                  styles.affineDocViewport,
                  styles.editorContainer
                )}
              >
                <Suspense fallback={<div>Loading JSON Viewer...</div>}>
                  <ReactJson src={snapshot ?? {}} />
                </Suspense>
              </Scrollable.Viewport>
              <Scrollable.Scrollbar
                className={clsx({
                  [styles.scrollbar]: !appSettings.clientBorder,
                })}
              />
            </Scrollable.Root>
          </AffineErrorBoundary>
          {isInTrash ? <TrashPageFooter /> : null}
        </div>
      </ViewBodyIsland>

      <RightSidebarViewIsland
        active={isActiveView}
        header={
          !isWindowsDesktop ? (
            <MultiTabSidebarHeaderSwitcher
              activeTabName={activeTabName ?? sidebarTabs[0]?.name}
              setActiveTabName={setActiveTabName}
              tabs={sidebarTabs}
            />
          ) : null
        }
        body={
          <MultiTabSidebarBody
            editor={null}
            tab={
              sidebarTabs.find(ext => ext.name === activeTabName) ??
              sidebarTabs[0]
            }
            onLoad={tabOnLoad}
          >
            {/* Show switcher in body for windows desktop */}
            {isWindowsDesktop && (
              <MultiTabSidebarHeaderSwitcher
                activeTabName={activeTabName ?? sidebarTabs[0]?.name}
                setActiveTabName={setActiveTabName}
                tabs={sidebarTabs}
              />
            )}
          </MultiTabSidebarBody>
        }
      />
      <GlobalPageHistoryModal />
      <PageAIOnboarding />
    </>
  );
});

export const DetailPageJson = ({
  pageId,
}: {
  pageId: string;
}): ReactElement => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const docsService = useService(DocsService);
  const docRecordList = docsService.list;
  const docListReady = useLiveData(docRecordList.isReady$);
  const docRecord = docRecordList.doc$(pageId).value;

  const [doc, setDoc] = useState<Doc | null>(null);

  useLayoutEffect(() => {
    if (!docRecord) {
      return;
    }
    const { doc: opened, release } = docsService.open(pageId);
    setDoc(opened);
    return () => {
      release();
    };
  }, [docRecord, docsService, pageId]);

  // set sync engine priority target
  useEffect(() => {
    currentWorkspace.engine.doc.setPriority(pageId, 10);
    return () => {
      currentWorkspace.engine.doc.setPriority(pageId, 5);
    };
  }, [currentWorkspace, pageId]);

  const isInTrash = useLiveData(doc?.meta$.map(meta => meta.trash));

  useEffect(() => {
    if (doc && isInTrash) {
      currentWorkspace.docCollection.awarenessStore.setReadonly(
        doc.blockSuiteDoc.blockCollection,
        true
      );
    }
  }, [currentWorkspace.docCollection.awarenessStore, doc, isInTrash]);

  // if sync engine has been synced and the page is null, show 404 page.
  if (docListReady && !doc) {
    return <PageNotFound noPermission />;
  }

  if (!doc) {
    return <PageDetailSkeleton key="current-page-is-null" />;
  }

  return (
    <FrameworkScope scope={doc.scope}>
      <DetailPageJsonImpl />
    </FrameworkScope>
  );
};

export const Component = () => {
  performanceRenderLogger.debug('DetailPageJson');

  const params = useParams();
  const pageId = params.pageId;

  return pageId ? <DetailPageJson pageId={pageId} /> : null;
};
