import {
  type DropTargetDropEvent,
  RssIcon2,
  Skeleton,
} from '@affine/component';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { useI18n } from '@affine/i18n';

import { ExplorerEmptySection } from '../../layouts/empty-section';

interface RootEmptyProps {
  onClickCreate?: () => void;
  isLoading?: boolean;
  onDrop?: (data: DropTargetDropEvent<AffineDNDData>) => void;
}

export const RootEmptyLoading = () => {
  return <Skeleton />;
};

export const RootEmptyReady = ({
  onClickCreate,
}: Omit<RootEmptyProps, 'isLoading'>) => {
  const t = useI18n();
  return (
    <ExplorerEmptySection
      icon={<RssIcon2 />}
      message={t['ai.wemem.rootAppSidebar.feeds.empty']()}
      messageTestId="slider-bar-subscription-empty-message"
      actionText={t['ai.wemem.rootAppSidebar.feeds.action']()}
      onActionClick={onClickCreate}
    />
  );
};

export const RootEmpty = ({ isLoading, ...props }: RootEmptyProps) => {
  return isLoading ? <RootEmptyLoading /> : <RootEmptyReady {...props} />;
};
