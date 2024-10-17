import { notify, Scrollable, useHasScrollTop } from '@affine/component';
import type { ChatPanel } from '@affine/core/blocksuite/presets/ai';
import { AIProvider } from '@affine/core/blocksuite/presets/ai';
import { PageAIOnboarding } from '@affine/core/components/affine/ai-onboarding';
import { EditorOutlineViewer } from '@affine/core/components/blocksuite/outline-viewer';
import { useAppSettingHelper } from '@affine/core/components/hooks/affine/use-app-setting-helper';
import { useDocMetaHelper } from '@affine/core/components/hooks/use-block-suite-page-meta';
import { EditorService } from '@affine/core/modules/editor';
import { ViewService } from '@affine/core/modules/workbench/services/view';
import { useI18n } from '@affine/i18n';
import { RefNodeSlotsProvider } from '@blocksuite/affine/blocks';
import { DisposableGroup } from '@blocksuite/affine/global/utils';
import { type AffineEditorContainer } from '@blocksuite/affine/presets';
import { AiIcon, TocIcon } from '@blocksuite/icons/rc';
import {
  DocService,
  FeatureFlagService,
  FrameworkScope,
  GlobalContextService,
  useLiveData,
  useServices,
  WorkspaceService,
} from '@toeverything/infra';
import clsx from 'clsx';
import { memo, useCallback, useEffect, useRef } from 'react';

import { AffineErrorBoundary } from '../../../../components/affine/affine-error-boundary';
import { GlobalPageHistoryModal } from '../../../../components/affine/page-history-modal';
import { useRegisterBlocksuiteEditorCommands } from '../../../../components/hooks/affine/use-register-blocksuite-editor-commands';
import { useActiveBlocksuiteEditor } from '../../../../components/hooks/use-block-suite-editor';
import { usePageDocumentTitle } from '../../../../components/hooks/use-global-state';
import { useNavigateHelper } from '../../../../components/hooks/use-navigate-helper';
import { PageDetailEditor } from '../../../../components/page-detail-editor';
import { TopTip } from '../../../../components/top-tip';
import {
  useIsActiveView,
  ViewSidebarTab,
  WorkbenchService,
} from '../../../../modules/workbench';
import { EditorChatPanel } from '../detail-page/tabs/chat';
import { EditorOutlinePanel } from '../detail-page/tabs/outline';
import * as styles from './feed-detail-page.css';
import { FeedPageHeader } from './feed-page-header';

export const FeedDetailPage = memo(function DetailPageImpl() {
  const {
    workbenchService,
    viewService,
    editorService,
    docService,
    workspaceService,
    globalContextService,
    featureFlagService,
  } = useServices({
    WorkbenchService,
    ViewService,
    EditorService,
    DocService,
    WorkspaceService,
    GlobalContextService,
    FeatureFlagService,
  });
  const workbench = workbenchService.workbench;
  const editor = editorService.editor;
  const view = viewService.view;
  const workspace = workspaceService.workspace;
  const docCollection = workspace.docCollection;
  const globalContext = globalContextService.globalContext;
  const doc = docService.doc;

  const mode = useLiveData(editor.mode$);
  const activeSidebarTab = useLiveData(view.activeSidebarTab$);

  const isInTrash = useLiveData(doc.meta$.map(meta => meta.trash));
  const { openPage, jumpToPageBlock } = useNavigateHelper();
  const editorContainer = useLiveData(editor.editorContainer$);

  const isSideBarOpen = useLiveData(workbench.sidebarOpen$);
  const { appSettings } = useAppSettingHelper();
  const chatPanelRef = useRef<ChatPanel | null>(null);
  const { setDocReadonly } = useDocMetaHelper();

  const isActiveView = useIsActiveView();
  // TODO(@eyhn): remove jotai here
  const [_, setActiveBlockSuiteEditor] = useActiveBlocksuiteEditor();

  const t = useI18n();

  useEffect(() => {
    if (isActiveView) {
      setActiveBlockSuiteEditor(editorContainer);
    }
  }, [editorContainer, isActiveView, setActiveBlockSuiteEditor]);

  useEffect(() => {
    const disposable = AIProvider.slots.requestOpenWithChat.on(params => {
      workbench.openSidebar();
      view.activeSidebarTab('chat');

      if (chatPanelRef.current) {
        const chatCards = chatPanelRef.current.querySelector('chat-cards');
        if (chatCards) chatCards.temporaryParams = params;
      }
    });
    return () => disposable.dispose();
  }, [activeSidebarTab, view, workbench]);

  useEffect(() => {
    if (isActiveView) {
      globalContext.docId.set(doc.id);
      globalContext.isDoc.set(true);

      return () => {
        globalContext.docId.set(null);
        globalContext.isDoc.set(false);
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

  useEffect(() => {
    setDocReadonly(doc.id, true);
  }, [doc.id, setDocReadonly]);

  useEffect(() => {
    if (isActiveView) {
      globalContext.isTrashDoc.set(!!isInTrash);

      return () => {
        globalContext.isTrashDoc.set(null);
      };
    }
    return;
  }, [globalContext, isActiveView, isInTrash]);

  useRegisterBlocksuiteEditorCommands(editor);
  const title = useLiveData(doc.title$);
  usePageDocumentTitle(title);

  const onLoad = useCallback(
    (editorContainer: AffineEditorContainer) => {
      // blocksuite editor host
      const editorHost = editorContainer.host;

      const std = editorHost?.std;
      const disposable = new DisposableGroup();
      if (std) {
        const refNodeSlots = std.getOptional(RefNodeSlotsProvider);
        if (refNodeSlots) {
          disposable.add(
            refNodeSlots.docLinkClicked.on(({ pageId, params }) => {
              if (params) {
                const { mode, blockIds, elementIds } = params;
                jumpToPageBlock(
                  docCollection.id,
                  pageId,
                  mode,
                  blockIds,
                  elementIds
                );
                return;
              }

              if (editor.doc.id === pageId) {
                return;
              }

              openPage(docCollection.id, pageId);
            })
          );
        }
      }

      disposable.add(
        AIProvider.slots.requestRunInEdgeless.on(({ host }) => {
          if (host === editorHost) {
            notify.warning({
              title: t['com.affine.ai.action.edgeless-only.dialog-title'](),
              action: {
                label: t['Switch'](),
                onClick: () => {
                  editor.setMode('edgeless');
                },
              },
            });
          }
        })
      );

      editor.setEditorContainer(editorContainer);
      const unbind = editor.bindEditorContainer(
        editorContainer,
        (editorContainer as any).docTitle // set from proxy
      );

      return () => {
        unbind();
        editor.setEditorContainer(null);
        disposable.dispose();
      };
    },
    [editor, openPage, docCollection.id, jumpToPageBlock, t]
  );

  const [refCallback, hasScrollTop] = useHasScrollTop();

  const openOutlinePanel = useCallback(() => {
    workbench.openSidebar();
    view.activeSidebarTab('outline');
  }, [workbench, view]);

  return (
    <FrameworkScope scope={editor.scope}>
      <FeedPageHeader page={doc} />
      <div
        className={styles.mainContainer}
        data-dynamic-top-border={BUILD_CONFIG.isElectron}
        data-has-scroll-top={hasScrollTop}
      >
        {/* Add a key to force rerender when page changed, to avoid error boundary persisting. */}
        <AffineErrorBoundary key={doc.id}>
          <TopTip pageId={doc.id} workspace={workspace} />
          <Scrollable.Root>
            <Scrollable.Viewport
              ref={refCallback}
              className={clsx(
                'affine-page-viewport',
                styles.affineDocViewport,
                styles.editorContainer
              )}
            >
              <PageDetailEditor onLoad={onLoad} />
            </Scrollable.Viewport>
            <Scrollable.Scrollbar
              className={clsx({
                [styles.scrollbar]: !appSettings.clientBorder,
              })}
            />
          </Scrollable.Root>
          <EditorOutlineViewer
            editor={editorContainer}
            show={mode === 'page' && !isSideBarOpen}
            openOutlinePanel={openOutlinePanel}
          />
        </AffineErrorBoundary>
      </div>
      {featureFlagService.flags.enable_ai.value && (
        <ViewSidebarTab
          tabId="chat"
          icon={<AiIcon />}
          unmountOnInactive={false}
        >
          <EditorChatPanel editor={editorContainer} ref={chatPanelRef} />
        </ViewSidebarTab>
      )}

      <ViewSidebarTab tabId="outline" icon={<TocIcon />}>
        <EditorOutlinePanel editor={editorContainer} />
      </ViewSidebarTab>

      <GlobalPageHistoryModal />
      <PageAIOnboarding />
    </FrameworkScope>
  );
});
