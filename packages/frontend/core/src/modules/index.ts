import { configureQuotaModule } from '@affine/core/modules/quota';
import { configureInfraModules, type Framework } from '@toeverything/infra';

import { configureCloudModule } from './cloud';
import { configureCollectionModule } from './collection';
import { configureDocLinksModule } from './doc-link';
import { configureDocsSearchModule } from './docs-search';
import { configureFindInPageModule } from './find-in-page';
import { configureNavigationModule } from './navigation';
import { configurePeekViewModule } from './peek-view';
import { configurePermissionsModule } from './permissions';
import { configureWorkspacePropertiesModule } from './properties';
import { configureQuickSearchModule } from './quicksearch';
import { configureRightSidebarModule } from './right-sidebar';
import { configureShareDocsModule } from './share-doc';
import { configureStorageImpls } from './storage';
import { configureFeedModule } from './subscription';
import { configureSubscribeFeedModule } from './subscription/subscribe-feed';
import { configureTagModule } from './tag';
import { configureTelemetryModule } from './telemetry';
import { configureWorkbenchModule } from './workbench';

export function configureCommonModules(framework: Framework) {
  configureInfraModules(framework);
  configureCollectionModule(framework);
  configureFeedModule(framework);
  configureNavigationModule(framework);
  configureSubscribeFeedModule(framework);
  configureRightSidebarModule(framework);
  configureTagModule(framework);
  configureWorkbenchModule(framework);
  configureWorkspacePropertiesModule(framework);
  configureCloudModule(framework);
  configureQuotaModule(framework);
  configurePermissionsModule(framework);
  configureShareDocsModule(framework);
  configureTelemetryModule(framework);
  configureFindInPageModule(framework);
  configurePeekViewModule(framework);
  configureQuickSearchModule(framework);
  configureDocsSearchModule(framework);
  configureDocLinksModule(framework);
}

export function configureImpls(framework: Framework) {
  configureStorageImpls(framework);
}
