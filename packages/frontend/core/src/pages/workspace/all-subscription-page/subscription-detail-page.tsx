import { Scrollable } from '@affine/component';
import { PageDetailSkeleton } from '@affine/component/page-detail-skeleton';
import { PageDetailEditor } from '@affine/core/components/page-detail-editor';
import { AIIsland } from '@affine/core/components/pure/ai-island';
import { SharePageNotFoundError } from '@affine/core/components/share-page-not-found-error';
import { useActiveBlocksuiteEditor } from '@affine/core/hooks/use-block-suite-editor';
import { usePageDocumentTitle } from '@affine/core/hooks/use-global-state';
import { noop } from '@blocksuite/global/utils';
import type { AffineEditorContainer } from '@blocksuite/presets';
import type { Doc as BlockSuiteDoc } from '@blocksuite/store';
import type { Doc, DocMode } from '@toeverything/infra';
import {
  DocsService,
  FrameworkScope,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { LoaderFunction } from 'react-router-dom';
import {
  isRouteErrorResponse,
  redirect,
  useRouteError,
} from 'react-router-dom';

import { PageNotFound } from '../../404';
import * as styles from './subscription-detail-page.css';
import { SubscriptionPageHeader } from './subscription-page-header';

type DocPublishMode = 'edgeless' | 'page';

export type CloudDoc = {
  arrayBuffer: ArrayBuffer;
  publishMode: DocPublishMode;
};

export async function downloadBinaryFromCloud(
  rootGuid: string,
  pageGuid: string
): Promise<CloudDoc | null> {
  const response = await fetch(`/api/workspaces/${rootGuid}/docs/${pageGuid}`);
  if (response.ok) {
    const publishMode = (response.headers.get('publish-mode') ||
      'page') as DocPublishMode;
    const arrayBuffer = await response.arrayBuffer();

    // return both arrayBuffer and publish mode
    return { arrayBuffer, publishMode };
  }

  return null;
}

type LoaderData = {
  pageId: string;
  workspaceId: string;
  publishMode: DocMode;
  pageArrayBuffer: ArrayBuffer;
  workspaceArrayBuffer: ArrayBuffer;
};

function assertDownloadResponse(
  value: CloudDoc | null
): asserts value is CloudDoc {
  if (
    !value ||
    !((value as CloudDoc).arrayBuffer instanceof ArrayBuffer) ||
    typeof (value as CloudDoc).publishMode !== 'string'
  ) {
    throw new Error('value is not a valid download response');
  }
}

export const loader: LoaderFunction = async ({ params }) => {
  const workspaceId = params?.workspaceId;
  const pageId = params?.pageId;
  if (!workspaceId || !pageId) {
    return redirect('/404');
  }

  const [workspaceResponse, pageResponse] = await Promise.all([
    downloadBinaryFromCloud(workspaceId, workspaceId),
    downloadBinaryFromCloud(workspaceId, pageId),
  ]);
  assertDownloadResponse(workspaceResponse);
  const { arrayBuffer: workspaceArrayBuffer } = workspaceResponse;
  assertDownloadResponse(pageResponse);
  const { arrayBuffer: pageArrayBuffer, publishMode } = pageResponse;

  return {
    workspaceId,
    pageId,
    publishMode,
    workspaceArrayBuffer,
    pageArrayBuffer,
  } satisfies LoaderData;
};

interface IDetailPageProps {
  docId: string;
}

const mode = 'page';

export const SubscriptionDetailPage = ({ docId }: IDetailPageProps) => {
  const [page, setPage] = useState<Doc | null>(null);
  const [editor, setActiveBlocksuiteEditor] = useActiveBlocksuiteEditor();
  const workspace = useService(WorkspaceService).workspace;
  const docsService = useService(DocsService);
  const docRecordList = docsService.list;
  const docListReady = useLiveData(docRecordList.isReady$);
  const docRecord = docRecordList.doc$(docId).value;
  // 使用 useRef 保存上一次的 release 函数
  const previousReleaseRef = useRef<(() => void) | undefined>(undefined);

  useLayoutEffect(() => {
    if (!docRecord) {
      return;
    }

    // 执行上一次的 release 函数
    const previousRelease = previousReleaseRef.current;
    if (previousRelease) {
      // previousRelease();
    }

    const { doc, release } = docsService.open(docId);
    workspace.docCollection.awarenessStore.setReadonly(
      doc.blockSuiteDoc.blockCollection,
      true
    );

    setPage(doc);

    // 保存本次的 release 函数，以备下次使用
    previousReleaseRef.current = release;
    return () => {
      release();
      previousReleaseRef.current = undefined;
    };
  }, [docRecord, docsService, docId, workspace.docCollection.awarenessStore]);

  const pageTitle = useLiveData(page?.title$);

  usePageDocumentTitle(pageTitle);

  const onEditorLoad = useCallback(
    (_: BlockSuiteDoc, editor: AffineEditorContainer) => {
      setActiveBlocksuiteEditor(editor);
      return noop;
    },
    [setActiveBlocksuiteEditor]
  );

  if (docListReady && !page) {
    return <PageNotFound noPermission />;
  }

  if (!page) {
    return <PageDetailSkeleton key="current-page-is-null" />;
  }

  return (
    <FrameworkScope scope={workspace.scope}>
      <FrameworkScope scope={page.scope}>
        <div className={styles.root}>
          <div className={styles.mainContainer}>
            <AIIsland />
            <SubscriptionPageHeader
              page={page}
              publishMode={mode}
              docCollection={page.blockSuiteDoc.collection}
            />
            <Scrollable.Root>
              <Scrollable.Viewport
                className={clsx('affine-page-viewport', styles.editorContainer)}
              >
                <PageDetailEditor
                  isPublic
                  publishMode={mode}
                  docCollection={page.blockSuiteDoc.collection}
                  pageId={page.id}
                  onLoad={onEditorLoad}
                />
              </Scrollable.Viewport>
              <Scrollable.Scrollbar />
            </Scrollable.Root>
          </div>
        </div>
      </FrameworkScope>
    </FrameworkScope>
  );
};

export function ErrorBoundary() {
  const error = useRouteError();
  return isRouteErrorResponse(error) ? (
    <h1>
      {error.status} {error.statusText}
    </h1>
  ) : (
    <SharePageNotFoundError />
  );
}
