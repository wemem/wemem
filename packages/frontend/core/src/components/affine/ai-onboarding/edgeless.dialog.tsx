import { Button, FlexWrapper, notify } from '@affine/component';
import { openSettingModalAtom } from '@affine/core/atoms';
import { SubscriptionService } from '@affine/core/modules/cloud';
import { mixpanel } from '@affine/core/utils';
import { useI18n } from '@affine/i18n';
import { AiIcon } from '@blocksuite/icons/rc';
import {
  DocService,
  useLiveData,
  useServices,
  WorkspaceService,
} from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { useAtomValue, useSetAtom } from 'jotai';
import Lottie from 'lottie-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { toggleEdgelessAIOnboarding } from './apis';
import * as styles from './edgeless.dialog.css';
import mouseTrackDark from './lottie/edgeless/mouse-track-dark.json';
import mouseTrackLight from './lottie/edgeless/mouse-track-light.json';
import {
  edgelessNotifyId$,
  localNotifyId$,
  showAIOnboardingGeneral$,
} from './state';

const EdgelessOnboardingAnimation = () => {
  const { resolvedTheme } = useTheme();

  const data = useMemo(() => {
    return resolvedTheme === 'dark' ? mouseTrackDark : mouseTrackLight;
  }, [resolvedTheme]);

  return (
    <div className={styles.thumb}>
      <Lottie
        loop
        autoplay
        animationData={data}
        className={styles.thumbContent}
      />
    </div>
  );
};

export const AIOnboardingEdgeless = () => {
  const { docService, subscriptionService } = useServices({
    WorkspaceService,
    DocService,
    SubscriptionService,
  });

  const t = useI18n();
  const notifyId = useLiveData(edgelessNotifyId$);
  const generalAIOnboardingOpened = useLiveData(showAIOnboardingGeneral$);
  const aiSubscription = useLiveData(subscriptionService.subscription.ai$);
  const settingModalOpen = useAtomValue(openSettingModalAtom);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const setSettingModal = useSetAtom(openSettingModalAtom);

  const doc = docService.doc;
  const mode = useLiveData(doc.mode$);

  const goToPricingPlans = useCallback(() => {
    mixpanel.track('PlansViewed', {
      page: 'whiteboard editor',
      segment: 'ai onboarding',
      module: 'whiteboard dialog',
    });
    setSettingModal({
      open: true,
      activeTab: 'plans',
      scrollAnchor: 'aiPricingPlan',
    });
  }, [setSettingModal]);

  useEffect(() => {
    if (settingModalOpen.open) return;
    if (generalAIOnboardingOpened) return;
    if (notifyId) return;
    if (mode !== 'edgeless') return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // try to close local onboarding
      notify.dismiss(localNotifyId$.value);

      const id = notify(
        {
          title: t['com.affine.ai-onboarding.edgeless.title'](),
          message: t['com.affine.ai-onboarding.edgeless.message'](),
          icon: <AiIcon />,
          iconColor: cssVar('processingColor'),
          thumb: <EdgelessOnboardingAnimation />,
          alignMessage: 'icon',
          onDismiss: () => toggleEdgelessAIOnboarding(false),
          footer: (
            <FlexWrapper marginTop={8} justifyContent="flex-end" gap="12px">
              <Button
                onClick={() => {
                  notify.dismiss(id);
                  toggleEdgelessAIOnboarding(false);
                }}
                type="plain"
                className={styles.actionButton}
              >
                <span className={styles.getStartedButtonText}>
                  {t['com.affine.ai-onboarding.edgeless.get-started']()}
                </span>
              </Button>
              {aiSubscription ? null : (
                <Button
                  className={styles.actionButton}
                  type="plain"
                  onClick={() => {
                    goToPricingPlans();
                    notify.dismiss(id);
                    toggleEdgelessAIOnboarding(false);
                  }}
                >
                  <span className={styles.purchaseButtonText}>
                    {t['com.affine.ai-onboarding.edgeless.purchase']()}
                  </span>
                </Button>
              )}
            </FlexWrapper>
          ),
        },
        { duration: 1000 * 60 * 10 }
      );
      edgelessNotifyId$.next(id);
    }, 1000);
  }, [
    aiSubscription,
    generalAIOnboardingOpened,
    goToPricingPlans,
    mode,
    notifyId,
    settingModalOpen,
    t,
  ]);

  return null;
};
