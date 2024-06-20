

import { Header } from '@affine/core/components/pure/header';
import { WorkspaceModeFilterTab } from '@affine/core/components/pure/workspace-mode-filter-tab';

export const FeedDetailHeader = () => {
  return (
    <Header
      center={<WorkspaceModeFilterTab activeFilter={'feeds'} />}
    />
  );
};
