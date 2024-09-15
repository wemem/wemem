import { ExplorerEmptySection } from '@affine/core/modules/explorer/views/layouts/empty-section';
import { useI18n } from '@affine/i18n';
import { PiRss } from 'react-icons/pi';

export const RootEmpty = () => {
  const t = useI18n();

  return (
    <ExplorerEmptySection
      icon={PiRss}
      message={t['ai.wemem.rootAppSidebar.subscription.empty']()}
      messageTestId="slider-bar-tags-empty-message"
    />
  );
};
