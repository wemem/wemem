import { registerNewFeedHelpCommands } from '@affine/core/modules/feed/subscribe-feed/commands';
import { useI18n } from '@affine/i18n';
import { useEffect } from 'react';

export function useRegisterNewFeedCommands() {
  const t = useI18n();
  // register AffineHelpCommands
  useEffect(() => {
    const unsub = registerNewFeedHelpCommands({
      t,
    });

    return () => {
      unsub();
    };
  }, [t]);
}
