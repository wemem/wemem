import type { Meta, StoryFn } from '@storybook/react';
import { useService, WorkspaceService } from '@toeverything/infra';

import { AddPageFeedButton } from './index';

export default {
  title: 'Components/AppSidebar/AddPageButton',
  component: AddPageFeedButton,
} satisfies Meta;

export const Default: StoryFn = () => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  return (
    <main style={{ width: '240px' }}>
      <AddPageFeedButton
        docCollection={currentWorkspace.docCollection}
        onClickNewPage={() => alert('opened')}
      />
    </main>
  );
};
