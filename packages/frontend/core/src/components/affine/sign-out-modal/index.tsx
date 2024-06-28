import type { ConfirmModalProps } from '@affine/component/ui/modal';
import { ConfirmModal } from '@affine/component/ui/modal';
import { useI18n } from '@affine/i18n';
import { useMemo } from 'react';

type SignOutConfirmModalI18NKeys =
  | 'title'
  | 'description'
  | 'cancel'
  | 'confirm';

export const SignOutModal = ({ ...props }: ConfirmModalProps) => {
  const { title, description, cancelText, confirmButtonOptions = {} } = props;
  const t = useI18n();

  const defaultTexts = useMemo(() => {
    const getDefaultText = (key: SignOutConfirmModalI18NKeys) => {
      return t[`com.affine.auth.sign-out.confirm-modal.${key}`]();
    };
    return {
      title: getDefaultText('title'),
      description: getDefaultText('description'),
      cancelText: getDefaultText('cancel'),
      children: getDefaultText('confirm'),
    };
  }, [t]);

  return (
    <ConfirmModal
      title={title ?? defaultTexts.title}
      description={description ?? defaultTexts.description}
      cancelText={cancelText ?? defaultTexts.cancelText}
      confirmButtonOptions={{
        type: 'error',
        ['data-testid' as string]: 'confirm-sign-out-button',
        children: confirmButtonOptions.children ?? defaultTexts.children,
      }}
      contentOptions={{
        ['data-testid' as string]: 'confirm-sign-out-modal',
      }}
      {...props}
    />
  );
};
