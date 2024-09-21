import { notify, Tooltip } from '@affine/component';
import { Loading } from '@affine/component/ui/loading';
import { WorkspaceAvatar } from '@affine/component/workspace-avatar';
import { openSettingModalAtom } from '@affine/core/atoms';
import { useDocEngineStatus } from '@affine/core/hooks/affine/use-doc-engine-status';
import { useWorkspaceInfo } from '@affine/core/hooks/use-workspace-info';
import { WorkspacePermissionService } from '@affine/core/modules/permissions';
import { UNTITLED_WORKSPACE_NAME } from '@affine/env/constant';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { useI18n } from '@affine/i18n';
import {
  CloudWorkspaceIcon,
  InformationFillDuotoneIcon,
  LocalWorkspaceIcon,
  NoNetworkIcon,
  UnsyncIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { useSetAtom } from 'jotai';
import { debounce } from 'lodash-es';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';

import { useSystemOnline } from '../../../../hooks/use-system-online';
import * as styles from './styles.css';

// FIXME:
// 2. Refactor the code to improve readability
const CloudWorkspaceStatus = () => {
  const t = useI18n();
  return (
    <>
      <CloudWorkspaceIcon />
      {t['ai.wemem.workspaceInfo.cloudWorkspaceStatus']()}
    </>
  );
};

const SyncingWorkspaceStatus = ({ progress }: { progress?: number }) => {
  const t = useI18n();
  return (
    <>
      <Loading progress={progress} speed={progress ? 0 : undefined} />
      {t['ai.wemem.workspaceInfo.syncingWorkspaceStatus']()}
    </>
  );
};

const UnSyncWorkspaceStatus = () => {
  const t = useI18n();
  return (
    <>
      <UnsyncIcon />
      {t['ai.wemem.workspaceInfo.unSyncWorkspaceStatus']()}
    </>
  );
};

const LocalWorkspaceStatus = () => {
  const t = useI18n();
  return (
    <>
      {!environment.isDesktop ? (
        <InformationFillDuotoneIcon style={{ color: cssVar('errorColor') }} />
      ) : (
        <LocalWorkspaceIcon />
      )}
      {t['ai.wemem.workspaceInfo.localWorkspaceStatus']()}
    </>
  );
};

const OfflineStatus = () => {
  const t = useI18n();
  return (
    <>
      <NoNetworkIcon />
      {t['ai.wemem.workspaceInfo.offlineStatus']()}
    </>
  );
};

const useSyncEngineSyncProgress = () => {
  const t = useI18n();
  const isOnline = useSystemOnline();
  const { syncing, progress, retrying, errorMessage } = useDocEngineStatus();
  const [isOverCapacity, setIsOverCapacity] = useState(false);

  const currentWorkspace = useService(WorkspaceService).workspace;
  const permissionService = useService(WorkspacePermissionService);
  const isOwner = useLiveData(permissionService.permission.isOwner$);
  useEffect(() => {
    // revalidate permission
    permissionService.permission.revalidate();
  }, [permissionService]);

  const setSettingModalAtom = useSetAtom(openSettingModalAtom);
  const jumpToPricePlan = useCallback(() => {
    setSettingModalAtom({
      open: true,
      activeTab: 'plans',
      scrollAnchor: 'cloudPricingPlan',
    });
  }, [setSettingModalAtom]);

  // debounce sync engine status
  useEffect(() => {
    const disposableOverCapacity =
      currentWorkspace.engine.blob.isStorageOverCapacity$.subscribe(
        debounce((isStorageOverCapacity: boolean) => {
          const isOver = isStorageOverCapacity;
          if (!isOver) {
            setIsOverCapacity(false);
            return;
          }
          setIsOverCapacity(true);
          if (isOwner) {
            notify.warning({
              title: t['com.affine.payment.storage-limit.title'](),
              message:
                t['com.affine.payment.storage-limit.description.owner'](),
              action: {
                label: t['com.affine.payment.storage-limit.view'](),
                onClick: jumpToPricePlan,
              },
            });
          } else {
            notify.warning({
              title: t['com.affine.payment.storage-limit.title'](),
              message:
                t['com.affine.payment.storage-limit.description.member'](),
            });
          }
        })
      );
    return () => {
      disposableOverCapacity?.unsubscribe();
    };
  }, [currentWorkspace, isOwner, jumpToPricePlan, t]);

  const content = useMemo(() => {
    // TODO(@eyhn): add i18n
    if (currentWorkspace.flavour === WorkspaceFlavour.LOCAL) {
      if (!environment.isDesktop) {
        return 'This is a local demo workspace.';
      }
      return 'Saved locally';
    }
    if (!isOnline) {
      return 'Disconnected, please check your network connection';
    }
    if (isOverCapacity) {
      return 'Sync failed due to insufficient cloud storage space.';
    }
    if (retrying && errorMessage) {
      return `${errorMessage}, reconnecting.`;
    }
    if (retrying) {
      return 'Sync disconnected due to unexpected issues, reconnecting.';
    }
    if (syncing) {
      return (
        `Syncing with AFFiNE Cloud` +
        (progress ? ` (${Math.floor(progress * 100)}%)` : '')
      );
    }

    return 'Synced with AFFiNE Cloud';
  }, [
    currentWorkspace.flavour,
    errorMessage,
    isOnline,
    isOverCapacity,
    progress,
    retrying,
    syncing,
  ]);

  const CloudWorkspaceSyncStatus = useCallback(() => {
    if (syncing) {
      return SyncingWorkspaceStatus({
        progress: progress ? Math.max(progress, 0.2) : undefined,
      });
    } else if (retrying) {
      return UnSyncWorkspaceStatus();
    } else {
      return CloudWorkspaceStatus();
    }
  }, [progress, retrying, syncing]);

  return {
    message: content,
    icon:
      currentWorkspace.flavour === WorkspaceFlavour.AFFINE_CLOUD ? (
        !isOnline ? (
          <OfflineStatus />
        ) : (
          <CloudWorkspaceSyncStatus />
        )
      ) : (
        <LocalWorkspaceStatus />
      ),
    active:
      currentWorkspace.flavour === WorkspaceFlavour.AFFINE_CLOUD &&
      ((syncing && progress !== undefined) || retrying) && // active if syncing or retrying
      !isOverCapacity, // not active if isOffline or OverCapacity
  };
};
const usePauseAnimation = (timeToResume = 5000) => {
  const [paused, setPaused] = useState(false);

  const resume = useCallback(() => {
    setPaused(false);
  }, []);

  const pause = useCallback(() => {
    setPaused(true);
    if (timeToResume > 0) {
      setTimeout(resume, timeToResume);
    }
  }, [resume, timeToResume]);

  return { paused, pause };
};

export const WorkspaceInfo = ({ name }: { name?: string }) => {
  const { message, active } = useSyncEngineSyncProgress();
  const currentWorkspace = useService(WorkspaceService).workspace;
  const isCloud = currentWorkspace.flavour === WorkspaceFlavour.AFFINE_CLOUD;
  const { progress } = useDocEngineStatus();
  const { paused, pause } = usePauseAnimation();

  // to make sure that animation will play first time
  const [delayActive, setDelayActive] = useState(false);
  useEffect(() => {
    if (paused) {
      return;
    }
    const delayOpen = 0;
    const delayClose = 200;
    let timer: ReturnType<typeof setTimeout>;
    if (active) {
      timer = setTimeout(() => {
        setDelayActive(active);
      }, delayOpen);
    } else {
      timer = setTimeout(() => {
        setDelayActive(active);
        pause();
      }, delayClose);
    }
    return () => clearTimeout(timer);
  }, [active, pause, paused]);

  return (
    <div className={styles.workspaceInfoSlider} data-active={delayActive}>
      <div className={styles.workspaceInfoSlide}>
        <div className={styles.workspaceInfo} data-type="normal">
          {name && (
            <div className={styles.workspaceName} data-testid="workspace-name">
              {name}
            </div>
          )}
          <div className={styles.workspaceStatus}>
            {isCloud ? <CloudWorkspaceStatus /> : <LocalWorkspaceStatus />}
          </div>
        </div>

        {/* when syncing/offline/... */}
        <div className={styles.workspaceInfo} data-type="events">
          <Tooltip
            content={message}
            options={{ className: styles.workspaceInfoTooltip }}
          >
            <div className={styles.workspaceActiveStatus}>
              <SyncingWorkspaceStatus progress={progress} />
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export const WorkspaceCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  const currentWorkspace = useService(WorkspaceService).workspace;

  const information = useWorkspaceInfo(currentWorkspace.meta);

  const name = information?.name ?? UNTITLED_WORKSPACE_NAME;

  return (
    <div
      className={styles.container}
      role="button"
      tabIndex={0}
      data-testid="current-workspace"
      id="current-workspace"
      ref={ref}
      {...props}
    >
      <WorkspaceAvatar
        key={currentWorkspace.id}
        meta={currentWorkspace.meta}
        rounded={3}
        data-testid="workspace-avatar"
        size={32}
        name={name}
        colorfulFallback
      />
      <WorkspaceInfo name={name} />
    </div>
  );
});

WorkspaceCard.displayName = 'WorkspaceCard';
