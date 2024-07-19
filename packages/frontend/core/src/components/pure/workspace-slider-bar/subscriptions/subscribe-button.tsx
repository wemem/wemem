import { IconButton } from '@affine/component/ui/button';
import { PlusIcon } from '@blocksuite/icons/rc';

export const SubscribeButton = ({ onClick }: { onClick: () => void }) => {
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
