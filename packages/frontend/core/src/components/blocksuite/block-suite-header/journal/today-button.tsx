import { Button } from '@affine/component';
import { useJournalRouteHelper } from '@affine/core/hooks/use-journal';
import type { DocCollection } from '@affine/core/shared';
import { useI18n } from '@affine/i18n';
import { useCallback } from 'react';

export interface JournalTodayButtonProps {
  docCollection: DocCollection;
}

export const JournalTodayButton = ({
  docCollection,
}: JournalTodayButtonProps) => {
  const t = useI18n();
  const journalHelper = useJournalRouteHelper(docCollection);

  const onToday = useCallback(() => {
    journalHelper.openToday();
  }, [journalHelper]);

  return (
    <Button
      size="default"
      onClick={onToday}
      style={{ height: 32, padding: '0px 8px' }}
    >
      {t['com.affine.today']()}
    </Button>
  );
};
