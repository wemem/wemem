import { registerNewFeedHelpCommands } from '@affine/core/modules/feed/new-feed/commands';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { useEffect } from 'react';

export function useRegisterNewFeedCommands() {
  const t = useAFFiNEI18N();
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
