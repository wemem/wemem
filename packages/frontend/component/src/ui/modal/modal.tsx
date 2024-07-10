import { CloseIcon } from '@blocksuite/icons/rc';
import type {
  DialogContentProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogProps,
} from '@radix-ui/react-dialog';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { forwardRef, useCallback } from 'react';

import type { IconButtonProps } from '../button';
import { IconButton } from '../button';
import * as styles from './styles.css';

export interface ModalProps extends DialogProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  minHeight?: CSSProperties['minHeight'];
  title?: React.ReactNode;
  description?: React.ReactNode;
  withoutCloseButton?: boolean;
  /**
   * __Click outside__ or __Press `Esc`__ won't close the modal
   * @default false
   */
  persistent?: boolean;

  portalOptions?: DialogPortalProps;
  contentOptions?: DialogContentProps;
  overlayOptions?: DialogOverlayProps;
  closeButtonOptions?: IconButtonProps;
}
type PointerDownOutsideEvent = Parameters<
  Exclude<DialogContentProps['onPointerDownOutside'], undefined>
>[0];

const getVar = (style: number | string = '', defaultValue = '') => {
  return style
    ? typeof style === 'number'
      ? `${style}px`
      : style
    : defaultValue;
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      width,
      height,
      minHeight = 194,
      title,
      description,
      withoutCloseButton = false,
      modal,
      persistent,

      portalOptions,
      contentOptions: {
        style: contentStyle,
        className: contentClassName,
        onPointerDownOutside,
        onEscapeKeyDown,
        ...otherContentOptions
      } = {},
      overlayOptions: {
        className: overlayClassName,
        ...otherOverlayOptions
      } = {},
      closeButtonOptions = {},
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Dialog.Root modal={modal} {...props}>
        <Dialog.Portal {...portalOptions}>
          <Dialog.Overlay
            className={clsx(styles.modalOverlay, overlayClassName)}
            {...otherOverlayOptions}
          />
          <div data-modal={modal} className={clsx(styles.modalContentWrapper)}>
            <Dialog.Content
              onPointerDownOutside={useCallback(
                (e: PointerDownOutsideEvent) => {
                  onPointerDownOutside?.(e);
                  persistent && e.preventDefault();
                },
                [onPointerDownOutside, persistent]
              )}
              onEscapeKeyDown={useCallback(
                (e: KeyboardEvent) => {
                  onEscapeKeyDown?.(e);
                  persistent && e.preventDefault();
                },
                [onEscapeKeyDown, persistent]
              )}
              className={clsx(styles.modalContent, contentClassName)}
              style={{
                ...assignInlineVars({
                  [styles.widthVar]: getVar(width, '50vw'),
                  [styles.heightVar]: getVar(height, 'unset'),
                  [styles.minHeightVar]: getVar(minHeight, '26px'),
                }),
                ...contentStyle,
              }}
              {...otherContentOptions}
              ref={ref}
            >
              {withoutCloseButton ? null : (
                <Dialog.Close asChild>
                  <IconButton
                    className={styles.closeButton}
                    aria-label="Close"
                    type="plain"
                    data-testid="modal-close-button"
                    {...closeButtonOptions}
                  >
                    <CloseIcon />
                  </IconButton>
                </Dialog.Close>
              )}
              {title ? (
                <Dialog.Title className={styles.modalHeader}>
                  {title}
                </Dialog.Title>
              ) : (
                // Refer: https://www.radix-ui.com/primitives/docs/components/dialog#title
                // If you want to hide the title, wrap it inside our Visually Hidden utility like this <VisuallyHidden asChild>.
                <VisuallyHidden.Root asChild>
                  <Dialog.Title></Dialog.Title>
                </VisuallyHidden.Root>
              )}
              {description ? (
                <Dialog.Description className={styles.modalDescription}>
                  {description}
                </Dialog.Description>
              ) : null}

              {children}
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }
);

Modal.displayName = 'Modal';
