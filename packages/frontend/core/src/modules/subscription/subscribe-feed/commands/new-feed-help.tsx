import { WechatIcon } from '@affine/component';
import { popupWindow } from '@affine/core/utils';
import type { useI18n } from '@affine/i18n';

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
      icon: <WechatIcon />,
      label: t['ai.wemem.subscription.new-feed.cmd.import-from-wechat'](),
      run() {
        popupWindow(runtimeConfig.changelogUrl);
      },
    })
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}
