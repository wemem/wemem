import { notify } from '@affine/component';
import { WorkspaceFlavour } from '@affine/env/workspace';
import {
  getWorkspacePublicPagesQuery,
  PublicPageMode,
  publishPageMutation,
  revokePublicPageMutation,
} from '@affine/graphql';
import { type I18nKeys, useI18n } from '@affine/i18n';
import { SingleSelectSelectSolidIcon } from '@blocksuite/icons/rc';
import type { DocMode, Workspace } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { useCallback, useMemo } from 'react';

import { useMutation } from '../use-mutation';
import { useQuery } from '../use-query';

type NotificationKey =
  | 'enableSuccessTitle'
  | 'enableSuccessMessage'
  | 'enableErrorTitle'
  | 'enableErrorMessage'
  | 'changeSuccessTitle'
  | 'changeErrorTitle'
  | 'changeErrorMessage'
  | 'disableSuccessTitle'
  | 'disableSuccessMessage'
  | 'disableErrorTitle'
  | 'disableErrorMessage';

const notificationToI18nKey = {
  enableSuccessTitle:
    'com.affine.share-menu.create-public-link.notification.success.title',
  enableSuccessMessage:
    'com.affine.share-menu.create-public-link.notification.success.message',
  enableErrorTitle:
    'com.affine.share-menu.create-public-link.notification.fail.title',
  enableErrorMessage:
    'com.affine.share-menu.create-public-link.notification.fail.message',
  changeSuccessTitle:
    'com.affine.share-menu.confirm-modify-mode.notification.success.title',
  changeErrorTitle:
    'com.affine.share-menu.confirm-modify-mode.notification.fail.title',
  changeErrorMessage:
    'com.affine.share-menu.confirm-modify-mode.notification.fail.message',
  disableSuccessTitle:
    'com.affine.share-menu.disable-publish-link.notification.success.title',
  disableSuccessMessage:
    'com.affine.share-menu.disable-publish-link.notification.success.message',
  disableErrorTitle:
    'com.affine.share-menu.disable-publish-link.notification.fail.title',
  disableErrorMessage:
    'com.affine.share-menu.disable-publish-link.notification.fail.message',
} satisfies Record<NotificationKey, I18nKeys>;

export function useIsSharedPage(
  workspaceId: string,
  pageId: string
): {
  isSharedPage: boolean;
  changeShare: (mode: DocMode) => void;
  disableShare: () => void;
  currentShareMode: DocMode;
  enableShare: (mode: DocMode) => void;
} {
  const t = useI18n();
  const { data, mutate } = useQuery({
    query: getWorkspacePublicPagesQuery,
    variables: {
      workspaceId,
    },
  });

  const { trigger: enableSharePage } = useMutation({
    mutation: publishPageMutation,
  });
  const { trigger: disableSharePage } = useMutation({
    mutation: revokePublicPageMutation,
  });

  const [isSharedPage, currentShareMode] = useMemo(() => {
    const publicPage = data?.workspace.publicPages.find(
      publicPage => publicPage.id === pageId
    );
    const isPageShared = !!publicPage;

    const currentShareMode: DocMode =
      publicPage?.mode === PublicPageMode.Edgeless ? 'edgeless' : 'page';

    return [isPageShared, currentShareMode];
  }, [data?.workspace.publicPages, pageId]);

  const enableShare = useCallback(
    (mode: DocMode) => {
      const publishMode =
        mode === 'edgeless' ? PublicPageMode.Edgeless : PublicPageMode.Page;

      enableSharePage({ workspaceId, pageId, mode: publishMode })
        .then(() => {
          notify.success({
            title: t[notificationToI18nKey['enableSuccessTitle']](),
            message: t[notificationToI18nKey['enableSuccessMessage']](),
            style: 'normal',
            icon: (
              <SingleSelectSelectSolidIcon color={cssVar('primaryColor')} />
            ),
          });
          return mutate();
        })
        .catch(e => {
          notify.error({
            title: t[notificationToI18nKey['enableErrorTitle']](),
            message: t[notificationToI18nKey['enableErrorMessage']](),
          });
          console.error(e);
        });
    },
    [enableSharePage, mutate, pageId, t, workspaceId]
  );

  const changeShare = useCallback(
    (mode: DocMode) => {
      const publishMode =
        mode === 'edgeless' ? PublicPageMode.Edgeless : PublicPageMode.Page;

      enableSharePage({ workspaceId, pageId, mode: publishMode })
        .then(() => {
          notify.success({
            title: t[notificationToI18nKey['changeSuccessTitle']](),
            message: t[
              'com.affine.share-menu.confirm-modify-mode.notification.success.message'
            ]({
              preMode:
                publishMode === PublicPageMode.Edgeless
                  ? t['Page']()
                  : t['Edgeless'](),
              currentMode:
                publishMode === PublicPageMode.Edgeless
                  ? t['Edgeless']()
                  : t['Page'](),
            }),
            style: 'normal',
            icon: (
              <SingleSelectSelectSolidIcon color={cssVar('primaryColor')} />
            ),
          });
          return mutate();
        })
        .catch(e => {
          notify.error({
            title: t[notificationToI18nKey['changeErrorTitle']](),
            message: t[notificationToI18nKey['changeErrorMessage']](),
          });
          console.error(e);
        });
    },
    [enableSharePage, mutate, pageId, t, workspaceId]
  );

  const disableShare = useCallback(() => {
    disableSharePage({ workspaceId, pageId })
      .then(() => {
        notify.success({
          title: t[notificationToI18nKey['disableSuccessTitle']](),
          message: t[notificationToI18nKey['disableSuccessMessage']](),
          style: 'normal',
          icon: <SingleSelectSelectSolidIcon color={cssVar('primaryColor')} />,
        });
        return mutate();
      })
      .catch(e => {
        notify.error({
          title: t[notificationToI18nKey['disableErrorTitle']](),
          message: t[notificationToI18nKey['disableErrorMessage']](),
        });
        console.error(e);
      });
  }, [disableSharePage, mutate, pageId, t, workspaceId]);

  return useMemo(
    () => ({
      isSharedPage,
      currentShareMode,
      enableShare,
      disableShare,
      changeShare,
    }),
    [isSharedPage, currentShareMode, enableShare, disableShare, changeShare]
  );
}

export function usePublicPages(workspace: Workspace) {
  const isLocalWorkspace = workspace.flavour === WorkspaceFlavour.LOCAL;
  const { data } = useQuery(
    isLocalWorkspace
      ? undefined
      : {
          query: getWorkspacePublicPagesQuery,
          variables: {
            workspaceId: workspace.id,
          },
        }
  );
  const maybeData = data as typeof data | undefined;

  const publicPages: {
    id: string;
    mode: DocMode;
  }[] = useMemo(
    () =>
      maybeData?.workspace.publicPages.map(i => ({
        id: i.id,
        mode: i.mode === PublicPageMode.Edgeless ? 'edgeless' : 'page',
      })) ?? [],
    [maybeData?.workspace.publicPages]
  );

  /**
   * Return `undefined` if the page is not public.
   */
  const getPublicMode = useCallback(
    (pageId: string) => {
      return publicPages.find(i => i.id === pageId)?.mode;
    },
    [publicPages]
  );
  return {
    publicPages,
    getPublicMode,
  };
}
