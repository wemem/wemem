import {
  Divider,
  type InlineEditHandle,
  Modal,
  Scrollable,
} from '@affine/component';
import { DocsSearchService } from '@affine/core/modules/docs-search';
import type { Doc } from '@blocksuite/store';
import {
  LiveData,
  useLiveData,
  useService,
  type Workspace,
} from '@toeverything/infra';
import { Suspense, useCallback, useContext, useMemo, useRef } from 'react';

import { BlocksuiteHeaderTitle } from '../../../blocksuite/block-suite-header/title';
import { managerContext } from '../common';
import {
  PagePropertiesAddProperty,
  PagePropertyRow,
  SortableProperties,
  usePagePropertiesManager,
} from '../table';
import { BackLinksRow } from './back-links-row';
import * as styles from './info-modal.css';
import { TagsRow } from './tags-row';
import { TimeRow } from './time-row';

export const InfoModal = ({
  open,
  onOpenChange,
  page,
  workspace,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: Doc;
  workspace: Workspace;
}) => {
  const titleInputHandleRef = useRef<InlineEditHandle>(null);
  const manager = usePagePropertiesManager(page);
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const docsSearchService = useService(DocsSearchService);
  const references = useLiveData(
    useMemo(
      () => LiveData.from(docsSearchService.watchRefsFrom(page.id), null),
      [docsSearchService, page.id]
    )
  );

  if (!manager.page || manager.readonly) {
    return null;
  }

  return (
    <Modal
      contentOptions={{
        className: styles.container,
        'aria-describedby': undefined,
      }}
      open={open}
      onOpenChange={onOpenChange}
      withoutCloseButton
    >
      <Scrollable.Root>
        <Scrollable.Viewport
          className={styles.viewport}
          data-testid="info-modal"
        >
          <div className={styles.titleContainer} data-testid="info-modal-title">
            <BlocksuiteHeaderTitle
              className={styles.titleStyle}
              inputHandleRef={titleInputHandleRef}
              pageId={page.id}
              docCollection={workspace.docCollection}
            />
          </div>
          <managerContext.Provider value={manager}>
            <Suspense>
              <InfoTable
                docId={page.id}
                onClose={handleClose}
                references={references}
                readonly={manager.readonly}
              />
            </Suspense>
          </managerContext.Provider>
        </Scrollable.Viewport>
        <Scrollable.Scrollbar className={styles.scrollBar} />
      </Scrollable.Root>
    </Modal>
  );
};

const InfoTable = ({
  onClose,
  references,
  docId,
  readonly,
}: {
  docId: string;
  onClose: () => void;
  readonly: boolean;
  references:
    | {
        docId: string;
        title: string;
      }[]
    | null;
}) => {
  const manager = useContext(managerContext);

  return (
    <div>
      <TimeRow docId={docId} />
      <Divider size="thinner" />
      {references && references.length > 0 ? (
        <>
          <BackLinksRow references={references} onClick={onClose} />
          <Divider size="thinner" />
        </>
      ) : null}
      <TagsRow docId={docId} readonly={readonly} />
      <SortableProperties>
        {properties =>
          properties.length ? (
            <div>
              {properties
                .filter(
                  property =>
                    manager.isPropertyRequired(property.id) ||
                    (property.visibility !== 'hide' &&
                      !(
                        property.visibility === 'hide-if-empty' &&
                        !property.value
                      ))
                )
                .map(property => (
                  <PagePropertyRow
                    key={property.id}
                    property={property}
                    rowNameClassName={styles.rowNameContainer}
                  />
                ))}
            </div>
          ) : null
        }
      </SortableProperties>
      {manager.readonly ? null : <PagePropertiesAddProperty />}
    </div>
  );
};
