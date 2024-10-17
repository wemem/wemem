import type { Permission } from '@affine/graphql';
import { inviteByEmailMutation } from '@affine/graphql';
import { useCallback } from 'react';

import { useMutation } from '../use-mutation';
import { useMutateCloud } from './use-mutate-cloud';

export function useInviteMember(workspaceId: string) {
  const { trigger, isMutating } = useMutation({
    mutation: inviteByEmailMutation,
  });
  const mutate = useMutateCloud();
  return {
    invite: useCallback(
      async (email: string, permission: Permission, sendInviteMail = false) => {
        const res = await trigger({
          workspaceId,
          email,
          permission,
          sendInviteMail,
        });
        await mutate();
        // return is successful
        return res?.invite;
      },
      [mutate, trigger, workspaceId]
    ),
    isMutating,
  };
}
