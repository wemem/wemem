import { IconButton } from '@affine/component';
import { Header } from '@affine/core/components/pure/header';
import { WorkspaceModeFilterTab } from '@affine/core/components/pure/workspace-mode-filter-tab';
import { PlusIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';

import * as styles from './header.css';

export const AllFeedHeader = ({
                                showCreateNew,
                                handleCreateFeed,
                              }: {
  showCreateNew: boolean;
  handleCreateFeed?: () => void;
}) => {
  return (
    <Header
      right={
        <IconButton
          type="default"
          icon={<PlusIcon fontSize={16} />}
          onClick={handleCreateFeed}
          className={clsx(
            styles.headerCreateNewCollectionIconButton,
            !showCreateNew && styles.headerCreateNewButtonHidden,
          )}
        />
      }
      center={<WorkspaceModeFilterTab activeFilter={'feeds'} />}
    />
  );
};
