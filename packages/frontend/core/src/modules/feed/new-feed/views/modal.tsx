import * as Dialog from '@radix-ui/react-dialog';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { useEffect } from 'react';
import { useTransition } from 'react-transition-state';

import * as styles from './modal.css';

// a CMDK modal that can be used to display a CMDK command
// it has a smooth animation and can be closed by clicking outside of the modal

export interface CMDKModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const animationTimeout = 120;

export const CMDKModal = ({
  onOpenChange,
  open,
  children,
}: React.PropsWithChildren<CMDKModalProps>) => {
  const [{ status }, toggle] = useTransition({
    timeout: animationTimeout,
  });
  useEffect(() => {
    toggle(open);
  }, [open]);
  return (
    <Dialog.Root modal open={status !== 'exited'} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.modalOverlay} />
        <div className={styles.modalContentWrapper}>
          <Dialog.Content
            style={assignInlineVars({
              [styles.animationTimeout]: `${animationTimeout}ms`,
            })}
            className={styles.modalContent}
            data-state={status}
          >
            {children}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
