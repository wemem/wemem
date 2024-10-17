import { useDocMetaHelper } from '@affine/core/components/hooks/use-block-suite-page-meta';
import { useDocCollectionHelper } from '@affine/core/components/hooks/use-block-suite-workspace-helper';
import { useNavigateHelper } from '@affine/core/components/hooks/use-navigate-helper';
import {
  getRefPageId,
  RefPageTagPrefix,
} from '@affine/core/modules/tag/entities/internal-tag';
import { DocsService, useService, WorkspaceService } from '@toeverything/infra';
import { applyUpdate, encodeStateAsUpdate } from 'yjs';

import { useAsyncReturnCallback } from './affine-async-ruturn-hooks';

export function useDuplicateDoc() {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const { setDocMeta, getDocMeta, setDocTitle } = useDocMetaHelper();
  const docCollection = currentWorkspace.docCollection;
  const { createDoc } = useDocCollectionHelper(currentWorkspace.docCollection);
  const { openPage } = useNavigateHelper();
  const pageRecordList = useService(DocsService).list;

  return useAsyncReturnCallback(
    async (
      pageId: string,
      openPageAfterDuplication: boolean = true,
      chains: {
        applyTags?: (tags: string[]) => string[];
      }
    ) => {
      const currentPageMode =
        pageRecordList.doc$(pageId).value?.primaryMode$.value;
      const currentPageMeta = getDocMeta(pageId);

      const refPageId = getRefPageId(currentPageMeta?.tags);
      if (refPageId) {
        const refPage = docCollection.getDoc(refPageId);
        const refPageMeta = getDocMeta(refPageId);
        if (refPage && refPageMeta) {
          openPageAfterDuplication &&
            openPage(docCollection.id, refPageId as string);
          return refPage;
        }
      }

      const newPage = createDoc();
      const currentPage = docCollection.getDoc(pageId);

      newPage.load();
      if (!currentPageMeta || !currentPage) {
        return newPage;
      }

      const update = encodeStateAsUpdate(currentPage.spaceDoc);
      applyUpdate(newPage.spaceDoc, update);

      setDocMeta(pageId, {
        tags: [
          ...(currentPageMeta.tags || []),
          `${RefPageTagPrefix}${newPage.id}`,
        ],
      });

      setDocMeta(newPage.id, {
        tags: [
          ...(chains?.applyTags
            ? chains.applyTags(currentPageMeta.tags || [])
            : currentPageMeta.tags || []),
          `${RefPageTagPrefix}${pageId}`,
        ],
      });

      pageRecordList
        .doc$(newPage.id)
        .value?.setPrimaryMode(currentPageMode || 'page');
      setDocTitle(newPage.id, currentPageMeta.title || '');
      openPageAfterDuplication && openPage(docCollection.id, newPage.id);
      return newPage;
    },
    [
      docCollection,
      createDoc,
      getDocMeta,
      openPage,
      pageRecordList,
      setDocMeta,
      setDocTitle,
    ]
  );
}
