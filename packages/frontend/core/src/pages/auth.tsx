import { notify } from '@affine/component';
import {
  ChangeEmailPage,
  ChangePasswordPage,
  ConfirmChangeEmail,
  OnboardingPage,
  SetPasswordPage,
  SignInSuccessPage,
  SignUpPage,
} from '@affine/component/auth-components';
import {
  changeEmailMutation,
  changePasswordMutation,
  fetcher,
  sendVerifyChangeEmailMutation,
  verifyEmailMutation,
} from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import type { ReactElement } from 'react';
import { useCallback, useEffect } from 'react';
import type { LoaderFunction } from 'react-router-dom';
import { redirect, useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { WindowsAppControls } from '../components/pure/header/windows-app-controls';
import { useMutation } from '../hooks/use-mutation';
import { RouteLogic, useNavigateHelper } from '../hooks/use-navigate-helper';
import { AuthService, ServerConfigService } from '../modules/cloud';

const authTypeSchema = z.enum([
  'onboarding',
  'setPassword',
  'signIn',
  'changePassword',
  'signUp',
  'changeEmail',
  'confirm-change-email',
  'subscription-redirect',
  'verify-email',
]);

export const AuthPage = (): ReactElement | null => {
  const authService = useService(AuthService);
  const account = useLiveData(authService.session.account$);
  const t = useI18n();
  const serverConfig = useService(ServerConfigService).serverConfig;
  const passwordLimits = useLiveData(
    serverConfig.credentialsRequirement$.map(r => r?.password)
  );

  const { authType } = useParams();
  const [searchParams] = useSearchParams();

  const { trigger: changePassword } = useMutation({
    mutation: changePasswordMutation,
  });

  const { trigger: sendVerifyChangeEmail } = useMutation({
    mutation: sendVerifyChangeEmailMutation,
  });

  const { jumpToIndex } = useNavigateHelper();

  const onSendVerifyChangeEmail = useCallback(
    async (email: string) => {
      const res = await sendVerifyChangeEmail({
        token: searchParams.get('token') || '',
        email,
        callbackUrl: `/auth/confirm-change-email`,
      }).catch(console.error);

      // FIXME: There is not notification
      if (res?.sendVerifyChangeEmail) {
        notify.success({
          title: t['com.affine.auth.sent.verify.email.hint'](),
        });
      } else {
        notify.error({
          title: t['com.affine.auth.sent.change.email.fail'](),
        });
      }

      return !!res?.sendVerifyChangeEmail;
    },
    [searchParams, sendVerifyChangeEmail, t]
  );

  const onSetPassword = useCallback(
    async (password: string) => {
      await changePassword({
        token: searchParams.get('token') || '',
        newPassword: password,
      });
    },
    [changePassword, searchParams]
  );
  const onOpenAffine = useCallback(() => {
    jumpToIndex(RouteLogic.REPLACE);
  }, [jumpToIndex]);

  if (!passwordLimits || !account) {
    // TODO(@eyhn): loading UI
    return null;
  }

  switch (authType) {
    case 'onboarding':
      return (
        <OnboardingPage
          user={account}
          onOpenAffine={onOpenAffine}
          windowControl={<WindowsAppControls />}
        />
      );
    case 'signUp': {
      return (
        <SignUpPage
          user={account}
          passwordLimits={passwordLimits}
          onSetPassword={onSetPassword}
          onOpenAffine={onOpenAffine}
        />
      );
    }
    case 'signIn': {
      return <SignInSuccessPage onOpenAffine={onOpenAffine} />;
    }
    case 'changePassword': {
      return (
        <ChangePasswordPage
          user={account}
          passwordLimits={passwordLimits}
          onSetPassword={onSetPassword}
          onOpenAffine={onOpenAffine}
        />
      );
    }
    case 'setPassword': {
      return (
        <SetPasswordPage
          user={account}
          passwordLimits={passwordLimits}
          onSetPassword={onSetPassword}
          onOpenAffine={onOpenAffine}
        />
      );
    }
    case 'changeEmail': {
      return (
        <ChangeEmailPage
          onChangeEmail={onSendVerifyChangeEmail}
          onOpenAffine={onOpenAffine}
        />
      );
    }
    case 'confirm-change-email': {
      return <ConfirmChangeEmail onOpenAffine={onOpenAffine} />;
    }
    case 'verify-email': {
      return <ConfirmChangeEmail onOpenAffine={onOpenAffine} />;
    }
  }
  return null;
};

export const loader: LoaderFunction = async args => {
  if (!args.params.authType) {
    return redirect('/404');
  }
  if (!authTypeSchema.safeParse(args.params.authType).success) {
    return redirect('/404');
  }

  if (args.params.authType === 'confirm-change-email') {
    const url = new URL(args.request.url);
    const searchParams = url.searchParams;
    const token = searchParams.get('token') ?? '';
    const email = decodeURIComponent(searchParams.get('email') ?? '');
    const res = await fetcher({
      query: changeEmailMutation,
      variables: {
        token: token,
        email: email,
      },
    }).catch(console.error);
    // TODO(@eyhn): Add error handling
    if (!res?.changeEmail) {
      return redirect('/expired');
    }
  } else if (args.params.authType === 'verify-email') {
    const url = new URL(args.request.url);
    const searchParams = url.searchParams;
    const token = searchParams.get('token') ?? '';
    const res = await fetcher({
      query: verifyEmailMutation,
      variables: {
        token: token,
      },
    }).catch(console.error);

    if (!res?.verifyEmail) {
      return redirect('/expired');
    }
  }
  return null;
};

export const Component = () => {
  const authService = useService(AuthService);
  const isRevalidating = useLiveData(authService.session.isRevalidating$);
  const loginStatus = useLiveData(authService.session.status$);
  const { jumpToExpired } = useNavigateHelper();

  useEffect(() => {
    authService.session.revalidate();
  }, [authService]);

  if (loginStatus === 'unauthenticated' && !isRevalidating) {
    jumpToExpired(RouteLogic.REPLACE);
  }

  if (loginStatus === 'authenticated') {
    return <AuthPage />;
  }

  // TODO(@eyhn): loading UI
  return null;
};
