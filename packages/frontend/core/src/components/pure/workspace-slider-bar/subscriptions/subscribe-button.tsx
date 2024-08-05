import { IconButton } from '@affine/component/ui/button';
import { PlusIcon } from '@blocksuite/icons/rc';
import type { MouseEventHandler } from 'react';

export const SubscribeButton = ({
  onClick,
}: {
  onClick: MouseEventHandler;
}) => {
  return (
    <IconButton
      data-testid="slider-bar-add-collection-button"
      onClick={onClick}
      size="small"
    >
      <PlusIcon />
    </IconButton>
  );
};
