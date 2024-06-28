import type { Meta, StoryFn } from '@storybook/react';

import { AddFeedButton } from './index';

export default {
  title: 'Components/AppSidebar/AddPageButton',
  component: AddFeedButton,
} satisfies Meta;

export const Default: StoryFn = () => {
  return (
    <main style={{ width: '240px' }}>
      <AddFeedButton onClick={() => alert('opened')} />
    </main>
  );
};
