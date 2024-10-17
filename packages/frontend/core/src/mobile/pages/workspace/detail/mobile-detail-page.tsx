import { useThemeColorV2 } from '@affine/component';
import { PageDetailSkeleton } from '@affine/component/page-detail-skeleton';
import { AffineErrorBoundary } from '@affine/core/components/affine/affine-error-boundary';
import { useRegisterBlocksuiteEditorCommands } from '@affine/core/components/hooks/affine/use-register-blocksuite-editor-commands';
import { useActiveBlocksuiteEditor } from '@affine/core/components/hooks/use-block-suite-editor';
import { useDocMetaHelper } from '@affine/core/components/hooks/use-block-suite-page-meta';
import { usePageDocumentTitle } from '@affine/core/components/hooks/use-global-state';
import { useNavigateHelper } from '@affine/core/components/hooks/use-navigate-helper';
import { PageDetailEditor } from '@affine/core/components/page-detail-editor';
import { DetailPageWrapper } from '@affine/core/desktop/pages/workspace/detail-page/detail-page-wrapper';
import { EditorService } from '@affine/core/modules/editor';
import { WorkbenchService } from '@affine/core/modules/workbench';
import { ViewService } from '@affine/core/modules/workbench/services/view';
import {
  BookmarkBlockService,
  customImageProxyMiddleware,
  EmbedGithubBlockService,
  EmbedLoomBlockService,
  EmbedYoutubeBlockService,
  ImageBlockService,
  RefNodeSlotsProvider,
} from '@blocksuite/affine/blocks';
import { DisposableGroup } from '@blocksuite/affine/global/utils';
import { type AffineEditorContainer } from '@blocksuite/affine/presets';
import {
  DocService,
  FrameworkScope,
  GlobalContextService,
  useLiveData,
  useServices,
  WorkspaceService,
} from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { PageHeader } from '../../../components';
import { JournalIconButton } from './journal-icon-button';
import * as styles from './mobile-detail-page.css';
import { PageHeaderMenuButton } from './page-header-more-button';
import { PageHeaderShareButton } from './page-header-share-button';

const DetailPageImpl = () => {
  const { editorService, docService, workspaceService, globalContextService } =
    useServices({
      WorkbenchService,
      ViewService,
      EditorService,
      DocService,
      WorkspaceService,
      GlobalContextService,
    });
  const editor = editorService.editor;
  const workspace = workspaceService.workspace;
  const docCollection = workspace.docCollection;
  const globalContext = globalContextService.globalContext;
  const doc = docService.doc;

  const mode = useLiveData(editor.mode$);

  const isInTrash = useLiveData(doc.meta$.map(meta => meta.trash));
  const { openPage, jumpToPageBlock } = useNavigateHelper();
  const editorContainer = useLiveData(editor.editorContainer$);

  const { setDocReadonly } = useDocMetaHelper();

  // TODO(@eyhn): remove jotai here
  const [_, setActiveBlockSuiteEditor] = useActiveBlocksuiteEditor();

  useEffect(() => {
    setActiveBlockSuiteEditor(editorContainer);
  }, [editorContainer, setActiveBlockSuiteEditor]);

  useEffect(() => {
    globalContext.docId.set(doc.id);
    globalContext.isDoc.set(true);

    return () => {
      globalContext.docId.set(null);
      globalContext.isDoc.set(false);
    };
  }, [doc, globalContext]);

  useEffect(() => {
    globalContext.docMode.set(mode);

    return () => {
      globalContext.docMode.set(null);
    };
  }, [doc, globalContext, mode]);

  useEffect(() => {
    setDocReadonly(doc.id, true);
  }, [doc.id, setDocReadonly]);

  useEffect(() => {
    globalContext.isTrashDoc.set(!!isInTrash);

    return () => {
      globalContext.isTrashDoc.set(null);
    };
  }, [globalContext, isInTrash]);

  useRegisterBlocksuiteEditorCommands(editor);
  const title = useLiveData(doc.title$);
  usePageDocumentTitle(title);

  const onLoad = useCallback(
    (editorContainer: AffineEditorContainer) => {
      // blocksuite editor host
      const editorHost = editorContainer.host;

      // provide image proxy endpoint to blocksuite
      editorHost?.std.clipboard.use(
        customImageProxyMiddleware(BUILD_CONFIG.imageProxyUrl)
      );
      ImageBlockService.setImageProxyURL(BUILD_CONFIG.imageProxyUrl);

      // provide link preview endpoint to blocksuite
      BookmarkBlockService.setLinkPreviewEndpoint(BUILD_CONFIG.linkPreviewUrl);
      EmbedGithubBlockService.setLinkPreviewEndpoint(
        BUILD_CONFIG.linkPreviewUrl
      );
      EmbedYoutubeBlockService.setLinkPreviewEndpoint(
        BUILD_CONFIG.linkPreviewUrl
      );
      EmbedLoomBlockService.setLinkPreviewEndpoint(BUILD_CONFIG.linkPreviewUrl);

      // provide page mode and updated date to blocksuite
      const refNodeService = editorHost?.std.getOptional(RefNodeSlotsProvider);
      const disposable = new DisposableGroup();
      if (refNodeService) {
        disposable.add(
          refNodeService.docLinkClicked.on(({ pageId, params }) => {
            if (params) {
              const { mode, blockIds, elementIds } = params;
              return jumpToPageBlock(
                docCollection.id,
                pageId,
                mode,
                blockIds,
                elementIds
              );
            }

            return openPage(docCollection.id, pageId);
          })
        );
      }

      editor.setEditorContainer(editorContainer);

      return () => {
        disposable.dispose();
      };
    },
    [docCollection.id, editor, jumpToPageBlock, openPage]
  );

  return (
    <FrameworkScope scope={editor.scope}>
      <div className={styles.mainContainer}>
        <div
          data-mode={mode}
          className={clsx(
            'affine-page-viewport',
            styles.affineDocViewport,
            styles.editorContainer
          )}
        >
          {/* Add a key to force rerender when page changed, to avoid error boundary persisting. */}
          <AffineErrorBoundary key={doc.id}>
            {mode === 'page' && (
              <JournalIconButton
                docId={doc.id}
                className={styles.journalIconButton}
              />
            )}
            <PageDetailEditor onLoad={onLoad} />
          </AffineErrorBoundary>
        </div>
      </div>
    </FrameworkScope>
  );
};

const skeleton = (
  <>
    <PageHeader back className={styles.header} />
    <PageDetailSkeleton />
  </>
);

const notFound = (
  <>
    <PageHeader back className={styles.header} />
    Page Not Found (TODO)
  </>
);

export const Component = () => {
  useThemeColorV2('layer/background/primary');
  const params = useParams();
  const pageId = params.pageId;

  if (!pageId) {
    return null;
  }

  return (
    <div className={styles.root}>
      <DetailPageWrapper
        skeleton={skeleton}
        notFound={notFound}
        pageId={pageId}
      >
        <PageHeader
          back
          className={styles.header}
          suffix={
            <>
              <PageHeaderShareButton />
              <PageHeaderMenuButton />
            </>
          }
        />
        <DetailPageImpl />
      </DetailPageWrapper>
    </div>
  );
};
