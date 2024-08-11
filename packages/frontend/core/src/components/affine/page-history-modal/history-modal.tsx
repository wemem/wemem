import { Loading, Scrollable } from '@affine/component';
import { EditorLoading } from '@affine/component/page-detail-skeleton';
import { Button, IconButton } from '@affine/component/ui/button';
import { Modal, useConfirmModal } from '@affine/component/ui/modal';
import { openSettingModalAtom } from '@affine/core/atoms';
import { useDocCollectionPageTitle } from '@affine/core/hooks/use-block-suite-workspace-page-title';
import { track } from '@affine/core/mixpanel';
import { WorkspacePermissionService } from '@affine/core/modules/permissions';
import { WorkspaceQuotaService } from '@affine/core/modules/quota';
import { i18nTime, Trans, useI18n } from '@affine/i18n';
import { CloseIcon, ToggleCollapseIcon } from '@blocksuite/icons/rc';
import type { Doc as BlockSuiteDoc, DocCollection } from '@blocksuite/store';
import * as Collapsible from '@radix-ui/react-collapsible';
import type { DialogContentProps } from '@radix-ui/react-dialog';
import {
  type DocMode,
  DocService,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import { atom, useAtom, useSetAtom } from 'jotai';
import type { PropsWithChildren } from 'react';
import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { encodeStateAsUpdate } from 'yjs';

import { pageHistoryModalAtom } from '../../../atoms/page-history';
import { BlockSuiteEditor } from '../../blocksuite/block-suite-editor';
import { StyledEditorModeSwitch } from '../../blocksuite/block-suite-mode-switch/style';
import {
  EdgelessSwitchItem,
  PageSwitchItem,
} from '../../blocksuite/block-suite-mode-switch/switch-items';
import { AffineErrorBoundary } from '../affine-error-boundary';
import {
  historyListGroupByDay,
  useDocSnapshotList,
  useRestorePage,
  useSnapshotPage,
} from './data';
import { EmptyHistoryShape } from './empty-history-shape';
import * as styles from './styles.css';

export interface PageHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docCollection: DocCollection;
  pageId: string;
}

const contentOptions: DialogContentProps = {
  ['data-testid' as string]: 'page-history-modal',
  onPointerDownOutside: e => {
    e.preventDefault();
  },
  style: {
    padding: 0,
    maxWidth: 944,
    backgroundColor: 'var(--affine-background-primary-color)',
    overflow: 'hidden',
  },
};

const ModalContainer = ({
  onOpenChange,
  open,
  children,
}: PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      width="calc(100% - 64px)"
      height="80%"
      withoutCloseButton
      contentOptions={contentOptions}
    >
      {children}
    </Modal>
  );
};

interface HistoryEditorPreviewProps {
  ts?: string;
  historyList: HistoryList;
  snapshotPage?: BlockSuiteDoc;
  mode: DocMode;
  onModeChange: (mode: DocMode) => void;
  title: string;
}

const HistoryEditorPreview = ({
  ts,
  historyList,
  snapshotPage,
  onModeChange,
  mode,
  title,
}: HistoryEditorPreviewProps) => {
  const { onSwitchToPageMode, onSwitchToEdgelessMode } = useMemo(
    () => ({
      onSwitchToPageMode: () => {
        onModeChange('page');
      },
      onSwitchToEdgelessMode: () => {
        onModeChange('edgeless');
      },
    }),
    [onModeChange]
  );

  const content = useMemo(() => {
    return (
      <div className={styles.previewContent}>
        <div className={styles.previewHeader}>
          <StyledEditorModeSwitch switchLeft={mode === 'page'}>
            <PageSwitchItem
              data-testid="switch-page-mode-button"
              active={mode === 'page'}
              data-event-props="$.docHistory.$.switchPageMode"
              data-event-args-type="page"
              onClick={onSwitchToPageMode}
            />
            <EdgelessSwitchItem
              data-testid="switch-edgeless-mode-button"
              active={mode === 'edgeless'}
              data-event-props="$.docHistory.$.switchPageMode"
              data-event-args-type="edgeless"
              onClick={onSwitchToEdgelessMode}
            />
          </StyledEditorModeSwitch>
          <div className={styles.previewHeaderTitle}>{title}</div>
          <div className={styles.previewHeaderTimestamp}>
            {ts
              ? i18nTime(ts, {
                  absolute: { accuracy: 'minute', noDate: true },
                })
              : null}
          </div>
        </div>

        {snapshotPage ? (
          <AffineErrorBoundary>
            <Scrollable.Root>
              <Scrollable.Viewport className="affine-page-viewport">
                <BlockSuiteEditor
                  className={styles.editor}
                  mode={mode}
                  page={snapshotPage}
                />
              </Scrollable.Viewport>
              <Scrollable.Scrollbar />
            </Scrollable.Root>
          </AffineErrorBoundary>
        ) : (
          <div className={styles.loadingContainer}>
            <Loading size={24} />
          </div>
        )}
      </div>
    );
  }, [
    mode,
    onSwitchToEdgelessMode,
    onSwitchToPageMode,
    snapshotPage,
    title,
    ts,
  ]);

  return (
    <div className={styles.previewWrapper}>
      {historyList.map((_item, i) => {
        const historyIndex = historyList.findIndex(h => h.timestamp === ts);
        const distance = i - historyIndex;
        const flag =
          distance > 20
            ? '> 20'
            : distance < -20
              ? '< -20'
              : distance.toString();
        return (
          <div data-distance={flag} key={i} className={styles.previewContainer}>
            {historyIndex === i ? content : null}
          </div>
        );
      })}
    </div>
  );
};
const planPromptClosedAtom = atom(false);

const PlanPrompt = () => {
  const workspaceQuotaService = useService(WorkspaceQuotaService);
  useEffect(() => {
    workspaceQuotaService.quota.revalidate();
  }, [workspaceQuotaService]);
  const workspaceQuota = useLiveData(workspaceQuotaService.quota.quota$);
  const isProWorkspace = useMemo(() => {
    return workspaceQuota
      ? workspaceQuota.humanReadable.name.toLowerCase() !== 'free'
      : null;
  }, [workspaceQuota]);
  const permissionService = useService(WorkspacePermissionService);
  const isOwner = useLiveData(permissionService.permission.isOwner$);
  useEffect(() => {
    // revalidate permission
    permissionService.permission.revalidate();
  }, [permissionService]);

  const setSettingModalAtom = useSetAtom(openSettingModalAtom);
  const [planPromptClosed, setPlanPromptClosed] = useAtom(planPromptClosedAtom);

  const closeFreePlanPrompt = useCallback(() => {
    setPlanPromptClosed(true);
  }, [setPlanPromptClosed]);

  const onClickUpgrade = useCallback(() => {
    setSettingModalAtom({
      open: true,
      activeTab: 'plans',
      scrollAnchor: 'cloudPricingPlan',
    });
    track.$.docHistory.$.viewPlans();
  }, [setSettingModalAtom]);

  const t = useI18n();

  const planTitle = useMemo(() => {
    return (
      <div className={styles.planPromptTitle}>
        {
          isProWorkspace !== null
            ? !isProWorkspace
              ? t[
                  'com.affine.history.confirm-restore-modal.plan-prompt.limited-title'
                ]()
              : t[
                  'com.affine.history.confirm-restore-modal.plan-prompt.title'
                ]()
            : '' /* TODO(@catsjuice): loading UI */
        }

        <IconButton onClick={closeFreePlanPrompt}>
          <CloseIcon />
        </IconButton>
      </div>
    );
  }, [closeFreePlanPrompt, isProWorkspace, t]);

  const planDescription = useMemo(() => {
    if (!isProWorkspace) {
      return (
        <>
          <Trans i18nKey="com.affine.history.confirm-restore-modal.free-plan-prompt.description">
            With the workspace creator&apos;s Free account, every member can
            access up to <b>7 days</b> of version history.
          </Trans>
          {isOwner ? (
            <span
              className={styles.planPromptUpdateButton}
              onClick={onClickUpgrade}
            >
              {t[
                'com.affine.history.confirm-restore-modal.pro-plan-prompt.upgrade'
              ]()}
            </span>
          ) : null}
        </>
      );
    } else {
      return (
        <Trans i18nKey="com.affine.history.confirm-restore-modal.pro-plan-prompt.description">
          With the workspace creator&apos;s Pro account, every member enjoys the
          privilege of accessing up to <b>30 days</b> of version history.
        </Trans>
      );
    }
  }, [isOwner, isProWorkspace, onClickUpgrade, t]);

  return !planPromptClosed ? (
    <div className={styles.planPromptWrapper}>
      <div className={styles.planPrompt}>
        {planTitle}
        {planDescription}
      </div>
    </div>
  ) : null;
};

type HistoryList = ReturnType<typeof useDocSnapshotList>[0];

const PageHistoryList = ({
  historyList,
  onLoadMore,
  loadingMore,
  activeVersion,
  onVersionChange,
}: {
  activeVersion?: string;
  onVersionChange: (version: string) => void;
  historyList: HistoryList;
  onLoadMore: (() => void) | false;
  loadingMore: boolean;
}) => {
  const t = useI18n();
  const historyListByDay = useMemo(() => {
    return historyListGroupByDay(historyList);
  }, [historyList]);

  const [collapsedMap, setCollapsedMap] = useState<Record<number, boolean>>({});

  useLayoutEffect(() => {
    if (historyList.length > 0 && !activeVersion) {
      onVersionChange(historyList[0].timestamp);
    }
  }, [activeVersion, historyList, onVersionChange]);

  return (
    <div className={styles.historyList}>
      <div className={styles.historyListHeader}>
        {t['com.affine.history.version-history']()}
      </div>
      <Scrollable.Root className={styles.historyListScrollable}>
        <Scrollable.Viewport className={styles.historyListScrollableInner}>
          <PlanPrompt />
          {historyListByDay.map(([day, list], i) => {
            const collapsed = collapsedMap[i];
            return (
              <Collapsible.Root
                open={!collapsed}
                key={day}
                className={styles.historyItemGroup}
              >
                <Collapsible.Trigger
                  role="button"
                  onClick={() =>
                    setCollapsedMap(prev => ({ ...prev, [i]: !collapsed }))
                  }
                  className={styles.historyItemGroupTitle}
                >
                  <div
                    data-testid="page-list-group-header-collapsed-button"
                    className={styles.collapsedIconContainer}
                  >
                    <ToggleCollapseIcon
                      className={styles.collapsedIcon}
                      data-collapsed={!!collapsed}
                    />
                  </div>
                  {day}
                </Collapsible.Trigger>
                <Collapsible.Content>
                  {list.map((history, idx) => {
                    return (
                      <Fragment key={history.timestamp}>
                        <div
                          className={styles.historyItem}
                          data-testid="version-history-item"
                          onClick={e => {
                            e.stopPropagation();
                            onVersionChange(history.timestamp);
                          }}
                          data-active={activeVersion === history.timestamp}
                        >
                          <button>
                            {i18nTime(history.timestamp, {
                              absolute: { noDate: true, accuracy: 'minute' },
                            })}
                          </button>
                        </div>
                        {idx > list.length - 1 ? (
                          <div className={styles.historyItemGap} />
                        ) : null}
                      </Fragment>
                    );
                  })}
                </Collapsible.Content>
              </Collapsible.Root>
            );
          })}
          {onLoadMore ? (
            <Button
              variant="plain"
              loading={loadingMore}
              disabled={loadingMore}
              className={styles.historyItemLoadMore}
              onClick={onLoadMore}
            >
              {t['com.affine.history.confirm-restore-modal.load-more']()}
            </Button>
          ) : null}
        </Scrollable.Viewport>
        <Scrollable.Scrollbar />
      </Scrollable.Root>
    </div>
  );
};

const EmptyHistoryPrompt = () => {
  const t = useI18n();

  return (
    <div
      className={styles.emptyHistoryPrompt}
      data-testid="empty-history-prompt"
    >
      <EmptyHistoryShape />
      <div className={styles.emptyHistoryPromptTitle}>
        {t['com.affine.history.empty-prompt.title']()}
      </div>
      <div className={styles.emptyHistoryPromptDescription}>
        {t['com.affine.history.empty-prompt.description']()}
      </div>
    </div>
  );
};

const PageHistoryManager = ({
  docCollection,
  pageId,
  onClose,
}: {
  docCollection: DocCollection;
  pageId: string;
  onClose: () => void;
}) => {
  const workspaceId = docCollection.id;
  const [activeVersion, setActiveVersion] = useState<string>();

  const pageDocId = useMemo(() => {
    return docCollection.getDoc(pageId)?.spaceDoc.guid ?? pageId;
  }, [pageId, docCollection]);
  const { openConfirmModal } = useConfirmModal();

  const snapshotPage = useSnapshotPage(docCollection, pageDocId, activeVersion);

  const t = useI18n();

  const { onRestore, isMutating } = useRestorePage(docCollection, pageId);

  const handleRestore = useMemo(
    () => async () => {
      if (!activeVersion || !snapshotPage) {
        return;
      }
      const snapshot = encodeStateAsUpdate(snapshotPage.spaceDoc);
      await onRestore(activeVersion, new Uint8Array(snapshot));
      // close the modal after restore
      onClose();
    },
    [activeVersion, onClose, onRestore, snapshotPage]
  );

  const doc = useService(DocService).doc;
  const [mode, setMode] = useState<DocMode>(doc.mode$.value);

  const title = useDocCollectionPageTitle(docCollection, pageId);

  const onConfirmRestore = useCallback(() => {
    openConfirmModal({
      title: t['com.affine.history.restore-current-version'](),
      description: t['com.affine.history.confirm-restore-modal.hint'](),
      cancelText: t['Cancel'](),
      contentOptions: {
        ['data-testid' as string]: 'confirm-restore-history-modal',
        style: { padding: '20px 26px' },
      },
      confirmText: t['com.affine.history.confirm-restore-modal.restore'](),
      confirmButtonOptions: {
        variant: 'primary',
        ['data-testid' as string]: 'confirm-restore-history-button',
      },
      onConfirm: handleRestore,
    });
  }, [handleRestore, openConfirmModal, t]);

  const [historyList, loadMore, loadingMore] = useDocSnapshotList(
    workspaceId,
    pageDocId
  );

  return (
    <div className={styles.root}>
      <div className={styles.modalContent} data-empty={!activeVersion}>
        <HistoryEditorPreview
          ts={activeVersion}
          historyList={historyList}
          snapshotPage={snapshotPage}
          mode={mode}
          onModeChange={setMode}
          title={title}
        />

        <PageHistoryList
          historyList={historyList}
          onLoadMore={loadMore}
          loadingMore={loadingMore}
          activeVersion={activeVersion}
          onVersionChange={setActiveVersion}
        />
      </div>

      {!activeVersion ? (
        <div className={styles.modalContent}>
          <EmptyHistoryPrompt />
        </div>
      ) : null}

      <div className={styles.historyFooter}>
        <Button onClick={onClose}>
          {t['com.affine.history.back-to-page']()}
        </Button>
        <div className={styles.spacer} />
        <Button
          variant="primary"
          onClick={onConfirmRestore}
          disabled={isMutating || !activeVersion}
        >
          {t['com.affine.history.restore-current-version']()}
        </Button>
      </div>
    </div>
  );
};

export const PageHistoryModal = ({
  onOpenChange,
  open,
  pageId,
  docCollection: workspace,
}: PageHistoryModalProps) => {
  const onClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <ModalContainer onOpenChange={onOpenChange} open={open}>
      <Suspense fallback={<EditorLoading />}>
        <PageHistoryManager
          onClose={onClose}
          pageId={pageId}
          docCollection={workspace}
        />
      </Suspense>
    </ModalContainer>
  );
};

export const GlobalPageHistoryModal = () => {
  const [{ open, pageId }, setState] = useAtom(pageHistoryModalAtom);
  const workspace = useService(WorkspaceService).workspace;
  const handleOpenChange = useCallback(
    (open: boolean) => {
      track.$.docHistory.$[open ? 'open' : 'close']();
      setState(prev => ({
        ...prev,
        open,
      }));
    },
    [setState]
  );

  return (
    <PageHistoryModal
      open={open}
      onOpenChange={handleOpenChange}
      pageId={pageId}
      docCollection={workspace.docCollection}
    />
  );
};
