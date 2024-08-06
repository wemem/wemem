import { popupWindow } from '@affine/core/utils';
import type { useI18n } from '@affine/i18n';
import { PiWechatLogo } from 'react-icons/pi';

import { registerNewFeedCommand } from './registry';

export function registerNewFeedHelpCommands({
  t,
}: {
  t: ReturnType<typeof useI18n>;
}) {
  const unsubs: Array<() => void> = [];
  unsubs.push(
    registerNewFeedCommand({
      id: 'affine:import-wechat',
      category: 'affine:help',
      icon: <PiWechatLogo />,
      label: t['ai.readease.feeds.new-feed.cmd.import-from-wechat'](),
      run() {
        popupWindow(runtimeConfig.changelogUrl);
      },
    })
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
