import { Divider, RssIcon } from '@affine/component';
import { Button } from '@affine/component/ui/button';
import { usePageHelper } from '@affine/core/components/blocksuite/block-suite-page-list/utils';
import { mixpanel } from '@affine/core/mixpanel';
import { NewSubscriptionService } from '@affine/core/modules/subscription/subscribe-feed/services/subscriptions-service';
import { isNewTabTrigger } from '@affine/core/utils';
import { useI18n } from '@affine/i18n';
import { EdgelessIcon, ImportIcon, PageIcon } from '@blocksuite/icons/rc';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useService, WorkspaceService } from '@toeverything/infra';
import { type ReactNode, useCallback, useRef } from 'react';

import { ViewBody, ViewTitle } from '../../../modules/workbench';
import * as styles from './style.css';

export const HomePage = () => {
  const workspace = useService(WorkspaceService).workspace;
  const { importFile, createEdgeless, createPage } = usePageHelper(
    workspace.docCollection
  );

  const t = useI18n();

  const scrollWrapper = useRef<HTMLDivElement>(null);

  const newSubscriptionService = useService(NewSubscriptionService);
  const handleOpenNewFeedModal = useCallback(() => {
    newSubscriptionService.subscribeFeed.show();
    mixpanel.track('NewOpened', {
      segment: 'navigation panel',
      control: 'new feeds button',
    });
  }, [newSubscriptionService]);

  return (
    <>
      <ViewTitle title={t['ai.wemem.workspaceSubPath.home']()} />
      <ViewBody>
        <div className={styles.body}>
          <div className={styles.header}>{t['ai.wemem.home.doc']()}</div>
          <ScrollArea.Root>
            <ScrollArea.Viewport
              ref={scrollWrapper}
              className={styles.scrollArea}
            >
              <div className={styles.planCardsWrapper} ref={scrollWrapper}>
                <ActionCard
                  name={t['ai.wemem.home.doc.create-page']()}
                  description={t['ai.wemem.home.doc.create-page.description']()}
                  icon={<PageIcon width={20} height={20} />}
                  action={t['ai.wemem.home.doc.create-page.action']()}
                  onClick={e =>
                    createPage(isNewTabTrigger(e) ? 'new-tab' : true)
                  }
                />
                <ActionCard
                  name={t['ai.wemem.home.doc.create-edgeless']()}
                  description={t[
                    'ai.wemem.home.doc.create-edgeless.description'
                  ]()}
                  icon={<EdgelessIcon width={20} height={20} />}
                  action={t['ai.wemem.home.doc.create-edgeless.action']()}
                  onClick={e =>
                    createEdgeless(isNewTabTrigger(e) ? 'new-tab' : true)
                  }
                />
                <ActionCard
                  name={t['ai.wemem.home.doc.import']()}
                  description={t['ai.wemem.home.doc.import.description']()}
                  icon={<ImportIcon width={20} height={20} />}
                  action={t['ai.wemem.home.doc.import.action']()}
                  onClick={() => void importFile()}
                />
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              forceMount
              orientation="horizontal"
              className={styles.scrollBar}
            >
              <ScrollArea.Thumb
                className={styles.scrollThumb}
              ></ScrollArea.Thumb>
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
          <Divider className={styles.divider} />
          <div className={styles.header}>
            {t['ai.wemem.home.subscription']()}
          </div>
          <ScrollArea.Root>
            <ScrollArea.Viewport
              ref={scrollWrapper}
              className={styles.scrollArea}
            >
              <div className={styles.planCardsWrapper} ref={scrollWrapper}>
                <ActionCard
                  name={t['ai.wemem.home.subscription.rss']()}
                  description={t[
                    'ai.wemem.home.subscription.rss.description'
                  ]()}
                  icon={<RssIcon size={20} />}
                  action={t['ai.wemem.home.subscription.rss.action']()}
                  onClick={handleOpenNewFeedModal}
                />
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              forceMount
              orientation="horizontal"
              className={styles.scrollBar}
            >
              <ScrollArea.Thumb
                className={styles.scrollThumb}
              ></ScrollArea.Thumb>
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </div>
      </ViewBody>
    </>
  );
};

interface PlanCardProps {
  name: string;
  description: string;
  icon: ReactNode;
  action: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ActionCard = (props: PlanCardProps) => {
  const { name, description, icon, action, onClick } = props;
  return (
    <div key={name} className={styles.actionCard}>
      <div className={styles.cardInfo}>
        <div style={{ paddingBottom: 12 }}>
          <section className={styles.title}>
            {icon}
            {name}
          </section>
          <section className={styles.description}>{description}</section>
        </div>
        <ActionButton action={action} onClick={onClick} />
      </div>
    </div>
  );
};

const ActionButton = ({
  disabled,
  onClick,
  action,
}: {
  disabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  action: string;
}) => {
  return (
    <div className={styles.cardAction}>
      <Button
        className={styles.cardAction}
        variant="primary"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => onClick(e)}
        onAuxClick={(e: React.MouseEvent<HTMLButtonElement>) => onClick(e)}
        disabled={disabled}
      >
        {action}
      </Button>
    </div>
  );
};

export const Component = () => {
  return <HomePage />;
};
