import { RssIcon2 } from '@affine/component';
import { ExplorerEmptySection } from '@affine/core/modules/explorer/views/layouts/empty-section';
import { useI18n } from '@affine/i18n';

export const RootEmpty = () => {
  const t = useI18n();

  return (
    <ExplorerEmptySection
      icon={<RssIcon2 />}
      message={t['ai.wemem.rootAppSidebar.subscription.empty']()}
      messageTestId="slider-bar-tags-empty-message"
    />
  );
};
