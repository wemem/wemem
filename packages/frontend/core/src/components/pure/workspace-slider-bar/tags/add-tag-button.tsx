import { IconButton } from '@affine/component/ui/button';
import { PlusIcon } from '@blocksuite/icons/rc';
import type { MouseEventHandler, ReactElement } from 'react';

export const AddTagButton = ({
  node,
  onClick,
}: {
  node: ReactElement | null;
  onClick: MouseEventHandler;
}) => {
  return (
    <>
      <IconButton
        data-testid="slider-bar-add-tag-button"
        onClick={onClick}
        size="small"
      >
        <PlusIcon />
      </IconButton>
      {node}
    </>
  );
};
