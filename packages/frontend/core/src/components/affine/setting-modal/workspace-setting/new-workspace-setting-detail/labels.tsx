import { WorkspacePermissionService } from '@affine/core/modules/permissions';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import { useEffect, useMemo } from 'react';

import * as style from './style.css';
import { useI18n } from '@affine/i18n';

type WorkspaceStatus =
  | 'local'
  | 'syncCloud'
  | 'syncDocker'
  | 'selfHosted'
  | 'joinedWorkspace'
  | 'availableOffline'
  | 'publishedToWeb';

type LabelProps = {
  value: string;
  background: string;
};

type LabelMap = {
  [key in WorkspaceStatus]: LabelProps;
};
type labelConditionsProps = {
  condition: boolean;
  label: WorkspaceStatus;
};
const Label = ({ value, background }: LabelProps) => {
  return (
    <div>
      <div className={style.workspaceLabel} style={{ background: background }}>
        {value}
      </div>
    </div>
  );
};
export const LabelsPanel = () => {
  const workspace = useService(WorkspaceService).workspace;
  const permissionService = useService(WorkspacePermissionService);
  const isOwner = useLiveData(permissionService.permission.isOwner$);
  useEffect(() => {
    permissionService.permission.revalidate();
  }, [permissionService]);
  const t = useI18n();
  const labelMap: LabelMap = useMemo(
    () => ({
      local: {
        value: t['ai.wemem.workspaceInfo.localWorkspaceStatus'](),
        background: 'var(--affine-tag-orange)',
      },
      syncCloud: {
        value: t['com.affine.setting.sign.message'](),
        background: 'var(--affine-tag-blue)',
      },
      syncDocker: {
        value: 'Sync with AFFiNE Docker',
        background: 'var(--affine-tag-green)',
      },
      selfHosted: {
        value: 'Self-Hosted Server',
        background: 'var(--affine-tag-purple)',
      },
      joinedWorkspace: {
        value: 'Joined Workspace',
        background: 'var(--affine-tag-yellow)',
      },
      availableOffline: {
        value: 'Available Offline',
        background: 'var(--affine-tag-green)',
      },
      publishedToWeb: {
        value: 'Published to Web',
        background: 'var(--affine-tag-blue)',
      },
    }),
    []
  );
  const labelConditions: labelConditionsProps[] = [
    { condition: !isOwner, label: 'joinedWorkspace' },
    { condition: workspace.flavour === 'local', label: 'local' },
    {
      condition: workspace.flavour === 'affine-cloud',
      label: 'syncCloud',
    },
  ];

  return (
    <div className={style.labelWrapper}>
      {labelConditions.map(
        ({ condition, label }) =>
          condition && (
            <Label
              key={label}
              value={labelMap[label].value}
              background={labelMap[label].background}
            />
          )
      )}
    </div>
  );
};
