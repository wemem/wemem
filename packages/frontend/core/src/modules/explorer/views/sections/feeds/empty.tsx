import { RssIcon2 } from '@affine/component';
import { ExplorerEmptySection } from '@affine/core/modules/explorer/views/layouts/empty-section';
import { useI18n } from '@affine/i18n';

export const RootEmpty = ({ onActionClick }: { onActionClick: () => void }) => {
  const t = useI18n();
  return (
    <ExplorerEmptySection
      icon={<RssIcon2 />}
      message={t['ai.wemem.rootAppSidebar.feeds.empty']()}
      messageTestId="slider-bar-subscription-empty-message"
      actionText={t['ai.wemem.rootAppSidebar.feeds.action']()}
      onActionClick={onActionClick}
    />
  );
};
