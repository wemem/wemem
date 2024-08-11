import {
  type DropTargetDropEvent,
  Skeleton,
  useDropTarget,
} from '@affine/component';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { useI18n } from '@affine/i18n';
import { FavoriteIcon } from '@blocksuite/icons/rc';

import { ExplorerEmptySection } from '../../layouts/empty-section';
import { DropEffect } from '../../tree';
import { favoriteRootCanDrop, favoriteRootDropEffect } from './dnd';

interface RootEmptyProps {
  onDrop?: (data: DropTargetDropEvent<AffineDNDData>) => void;
  isLoading?: boolean;
}

const RootEmptyLoading = () => {
  return <Skeleton />;
};
const RootEmptyReady = ({ onDrop }: Omit<RootEmptyProps, 'isLoading'>) => {
  const t = useI18n();

  const { dropTargetRef, draggedOverDraggable, draggedOverPosition } =
    useDropTarget<AffineDNDData>(
      () => ({
        data: {
          at: 'explorer:favorite:root',
        },
        onDrop: onDrop,
        canDrop: favoriteRootCanDrop,
      }),
      [onDrop]
    );

  return (
    <ExplorerEmptySection
      ref={dropTargetRef}
      icon={FavoriteIcon}
      message={t['com.affine.rootAppSidebar.favorites.empty']()}
      messageTestId="slider-bar-favorites-empty-message"
    >
      {draggedOverDraggable && (
        <DropEffect
          position={draggedOverPosition}
          dropEffect={favoriteRootDropEffect({
            source: draggedOverDraggable,
            treeInstruction: null,
          })}
        />
      )}
    </ExplorerEmptySection>
  );
};

export const RootEmpty = ({ isLoading, ...props }: RootEmptyProps) => {
  return isLoading ? <RootEmptyLoading /> : <RootEmptyReady {...props} />;
};
