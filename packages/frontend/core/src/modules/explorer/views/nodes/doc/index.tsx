import {
  type DropTargetDropEvent,
  type DropTargetOptions,
  Loading,
  toast,
  Tooltip,
} from '@affine/component';
import { InfoModal } from '@affine/core/components/affine/page-properties';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { track } from '@affine/core/mixpanel';
import { DocsSearchService } from '@affine/core/modules/docs-search';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { useI18n } from '@affine/i18n';
import {
  EdgelessIcon,
  LinkedEdgelessIcon,
  LinkedPageIcon,
  PageIcon,
} from '@blocksuite/icons/rc';
import {
  DocsService,
  GlobalContextService,
  LiveData,
  useLiveData,
  useServices,
} from '@toeverything/infra';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';

import { ExplorerTreeNode, type ExplorerTreeNodeDropEffect } from '../../tree';
import type { GenericExplorerNode } from '../types';
import { Empty } from './empty';
import { useExplorerDocNodeOperations } from './operations';
import * as styles from './styles.css';

export const ExplorerDocNode = ({
  docId,
  onDrop,
  location,
  reorderable,
  isLinked,
  canDrop,
  operations: additionalOperations,
  dropEffect,
}: {
  docId: string;
  isLinked?: boolean;
} & GenericExplorerNode) => {
  const t = useI18n();
  const { docsSearchService, docsService, globalContextService } = useServices({
    DocsSearchService,
    DocsService,
    GlobalContextService,
  });
  const active =
    useLiveData(globalContextService.globalContext.docId.$) === docId;
  const [collapsed, setCollapsed] = useState(true);

  const docRecord = useLiveData(docsService.list.doc$(docId));
  const docMode = useLiveData(docRecord?.mode$);
  const docTitle = useLiveData(docRecord?.title$);
  const isInTrash = useLiveData(docRecord?.trash$);

  const Icon = useCallback(
    ({ className }: { className?: string }) => {
      return isLinked ? (
        docMode === 'edgeless' ? (
          <LinkedEdgelessIcon className={className} />
        ) : (
          <LinkedPageIcon className={className} />
        )
      ) : docMode === 'edgeless' ? (
        <EdgelessIcon className={className} />
      ) : (
        <PageIcon className={className} />
      );
    },
    [docMode, isLinked]
  );

  const children = useLiveData(
    useMemo(
      () => LiveData.from(docsSearchService.watchRefsFrom(docId), null),
      [docsSearchService, docId]
    )
  );

  const indexerLoading = useLiveData(
    docsSearchService.indexer.status$.map(
      v => v.remaining === undefined || v.remaining > 0
    )
  );
  const [referencesLoading, setReferencesLoading] = useState(true);
  useLayoutEffect(() => {
    setReferencesLoading(
      prev =>
        prev &&
        indexerLoading /* after loading becomes false, it never becomes true */
    );
  }, [indexerLoading]);

  const dndData = useMemo(() => {
    return {
      draggable: {
        entity: {
          type: 'doc',
          id: docId,
        },
        from: location,
      },
      dropTarget: {
        at: 'explorer:doc',
      },
    } satisfies AffineDNDData;
  }, [docId, location]);

  const handleRename = useAsyncCallback(
    async (newName: string) => {
      await docsService.changeDocTitle(docId, newName);
      track.$.navigationPanel.organize.renameOrganizeItem({ type: 'doc' });
    },
    [docId, docsService]
  );

  const handleDropOnDoc = useAsyncCallback(
    async (data: DropTargetDropEvent<AffineDNDData>) => {
      if (data.treeInstruction?.type === 'make-child') {
        if (data.source.data.entity?.type === 'doc') {
          await docsService.addLinkedDoc(docId, data.source.data.entity.id);
          track.$.navigationPanel.docs.linkDoc({
            control: 'drag',
          });
        } else {
          toast(t['com.affine.rootAppSidebar.doc.link-doc-only']());
        }
      } else {
        onDrop?.(data);
      }
    },
    [docId, docsService, onDrop, t]
  );

  const handleDropEffectOnDoc = useCallback<ExplorerTreeNodeDropEffect>(
    data => {
      if (data.treeInstruction?.type === 'make-child') {
        if (data.source.data.entity?.type === 'doc') {
          return 'link';
        }
      } else {
        return dropEffect?.(data);
      }
      return;
    },
    [dropEffect]
  );

  const handleDropOnPlaceholder = useAsyncCallback(
    async (data: DropTargetDropEvent<AffineDNDData>) => {
      if (data.source.data.entity?.type === 'doc') {
        // TODO(eyhn): timeout&error handling
        await docsService.addLinkedDoc(docId, data.source.data.entity.id);
        track.$.navigationPanel.docs.linkDoc({
          control: 'drag',
        });
      } else {
        toast(t['com.affine.rootAppSidebar.doc.link-doc-only']());
      }
    },
    [docId, docsService, t]
  );

  const handleCanDrop = useMemo<DropTargetOptions<AffineDNDData>['canDrop']>(
    () => args => {
      const entityType = args.source.data.entity?.type;
      return args.treeInstruction?.type !== 'make-child'
        ? (typeof canDrop === 'function' ? canDrop(args) : canDrop) ?? true
        : entityType === 'doc';
    },
    [canDrop]
  );

  const [enableInfoModal, setEnableInfoModal] = useState(false);
  const operations = useExplorerDocNodeOperations(
    docId,
    useMemo(
      () => ({
        openInfoModal: () => setEnableInfoModal(true),
        openNodeCollapsed: () => setCollapsed(false),
      }),
      []
    )
  );

  const finalOperations = useMemo(() => {
    if (additionalOperations) {
      return [...operations, ...additionalOperations];
    }
    return operations;
  }, [additionalOperations, operations]);

  if (isInTrash || !docRecord) {
    return null;
  }

  return (
    <>
      <ExplorerTreeNode
        icon={Icon}
        name={docTitle || t['Untitled']()}
        dndData={dndData}
        onDrop={handleDropOnDoc}
        renameable
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        canDrop={handleCanDrop}
        to={`/${docId}`}
        active={active}
        postfix={
          referencesLoading &&
          !collapsed && (
            <Tooltip
              content={t['com.affine.rootAppSidebar.docs.references-loading']()}
            >
              <div className={styles.loadingIcon}>
                <Loading />
              </div>
            </Tooltip>
          )
        }
        reorderable={reorderable}
        onRename={handleRename}
        childrenPlaceholder={<Empty onDrop={handleDropOnPlaceholder} />}
        operations={finalOperations}
        dropEffect={handleDropEffectOnDoc}
        data-testid={`explorer-doc-${docId}`}
      >
        {children?.map(child => (
          <ExplorerDocNode
            key={child.docId}
            docId={child.docId}
            reorderable={false}
            location={{
              at: 'explorer:doc:linked-docs',
              docId,
            }}
            isLinked
          />
        ))}
      </ExplorerTreeNode>
      {enableInfoModal && (
        <InfoModal
          open={enableInfoModal}
          onOpenChange={setEnableInfoModal}
          docId={docId}
        />
      )}
    </>
  );
};
