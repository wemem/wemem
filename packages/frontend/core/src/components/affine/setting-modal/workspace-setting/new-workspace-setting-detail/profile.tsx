import { FlexWrapper, Input, notify, Wrapper } from '@affine/component';
import { Button } from '@affine/component/ui/button';
import { WorkspaceAvatar } from '@affine/component/workspace-avatar';
import { Upload } from '@affine/core/components/pure/file-upload';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { WorkspacePermissionService } from '@affine/core/modules/permissions';
import { validateAndReduceImage } from '@affine/core/utils/reduce-image';
import { UNTITLED_WORKSPACE_NAME } from '@affine/env/constant';
import { useI18n } from '@affine/i18n';
import { CameraIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService, WorkspaceService } from '@toeverything/infra';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import * as style from './style.css';

const avatarImageProps = { style: { borderRadius: 8 } };

export const ProfilePanel = () => {
  const t = useI18n();

  const workspace = useService(WorkspaceService).workspace;
  const permissionService = useService(WorkspacePermissionService);
  const isOwner = useLiveData(permissionService.permission.isOwner$);
  useEffect(() => {
    permissionService.permission.revalidate();
  }, [permissionService]);
  const workspaceIsReady = useLiveData(workspace?.engine.rootDocState$)?.ready;

  const [name, setName] = useState('');

  useEffect(() => {
    if (workspace?.docCollection) {
      setName(workspace.docCollection.meta.name ?? UNTITLED_WORKSPACE_NAME);
      const dispose = workspace.docCollection.meta.commonFieldsUpdated.on(
        () => {
          setName(workspace.docCollection.meta.name ?? UNTITLED_WORKSPACE_NAME);
        }
      );
      return () => {
        dispose.dispose();
      };
    } else {
      setName(UNTITLED_WORKSPACE_NAME);
    }
    return;
  }, [workspace]);

  const setWorkspaceAvatar = useCallback(
    async (file: File | null) => {
      if (!workspace) {
        return;
      }
      if (!file) {
        workspace.docCollection.meta.setAvatar('');
        return;
      }
      try {
        const reducedFile = await validateAndReduceImage(file);
        const blobs = workspace.docCollection.blobSync;
        const blobId = await blobs.set(reducedFile);
        workspace.docCollection.meta.setAvatar(blobId);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [workspace]
  );

  const setWorkspaceName = useCallback(
    (name: string) => {
      if (!workspace) {
        return;
      }
      workspace.docCollection.meta.setName(name);
    },
    [workspace]
  );

  const [input, setInput] = useState<string>('');
  useEffect(() => {
    setInput(name);
  }, [name]);

  const handleUpdateWorkspaceName = useCallback(
    (name: string) => {
      setWorkspaceName(name);
      notify.success({ title: t['Update workspace name success']() });
    },
    [setWorkspaceName, t]
  );

  const handleSetInput = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleKeyUp = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.code === 'Enter' && name !== input) {
        handleUpdateWorkspaceName(input);
      }
    },
    [handleUpdateWorkspaceName, input, name]
  );

  const handleClick = useCallback(() => {
    handleUpdateWorkspaceName(input);
  }, [handleUpdateWorkspaceName, input]);

  const handleRemoveUserAvatar = useAsyncCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      await setWorkspaceAvatar(null);
    },
    [setWorkspaceAvatar]
  );

  const handleUploadAvatar = useCallback(
    (file: File) => {
      setWorkspaceAvatar(file)
        .then(() => {
          notify.success({ title: 'Update workspace avatar success' });
        })
        .catch(error => {
          notify.error({
            title: 'Update workspace avatar failed',
            message: error,
          });
        });
    },
    [setWorkspaceAvatar]
  );

  const canAdjustAvatar = workspaceIsReady && isOwner;

  return (
    <div className={style.profileWrapper}>
      <Upload
        accept="image/gif,image/jpeg,image/jpg,image/png,image/svg"
        fileChange={handleUploadAvatar}
        data-testid="upload-avatar"
        disabled={!isOwner}
      >
        <WorkspaceAvatar
          meta={workspace.meta}
          size={56}
          name={name}
          imageProps={avatarImageProps}
          fallbackProps={avatarImageProps}
          hoverWrapperProps={avatarImageProps}
          colorfulFallback
          hoverIcon={isOwner ? <CameraIcon /> : undefined}
          onRemove={canAdjustAvatar ? handleRemoveUserAvatar : undefined}
          avatarTooltipOptions={
            canAdjustAvatar
              ? { content: t['Click to replace photo']() }
              : undefined
          }
          removeTooltipOptions={
            canAdjustAvatar ? { content: t['Remove photo']() } : undefined
          }
          data-testid="workspace-setting-avatar"
          removeButtonProps={{
            ['data-testid' as string]: 'workspace-setting-remove-avatar-button',
          }}
        />
      </Upload>

      <Wrapper marginLeft={20}>
        <div className={style.label}>{t['Workspace Name']()}</div>
        <FlexWrapper alignItems="center" flexGrow="1">
          <Input
            disabled={!workspaceIsReady || !isOwner}
            value={input}
            style={{ width: 280, height: 32 }}
            data-testid="workspace-name-input"
            placeholder={t['Workspace Name']()}
            maxLength={64}
            minLength={0}
            onChange={handleSetInput}
            onKeyUp={handleKeyUp}
          />
          {input === name ? null : (
            <Button
              data-testid="save-workspace-name"
              onClick={handleClick}
              style={{
                marginLeft: '12px',
              }}
            >
              {t['com.affine.editCollection.save']()}
            </Button>
          )}
        </FlexWrapper>
      </Wrapper>
    </div>
  );
};
