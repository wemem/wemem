import { configureQuotaModule } from '@affine/core/modules/quota';
import { configureInfraModules, type Framework } from '@toeverything/infra';

import { configureCloudModule } from './cloud';
import { configureCollectionModule } from './collection';
import { configureDocLinksModule } from './doc-link';
import { configureDocsSearchModule } from './docs-search';
import { configureExplorerModule } from './explorer';
import { configureFavoriteModule } from './favorite';
import { configureFindInPageModule } from './find-in-page';
import { configureNavigationModule } from './navigation';
import { configureOrganizeModule } from './organize';
import { configurePeekViewModule } from './peek-view';
import { configurePermissionsModule } from './permissions';
import { configureWorkspacePropertiesModule } from './properties';
import { configureQuickSearchModule } from './quicksearch';
import { configureShareDocsModule } from './share-doc';
import { configureFeedModule } from './feed';
import { configureSubscribeFeedModule } from '@affine/core/modules/feed-newly';
import { configureTagModule } from './tag';
import { configureTelemetryModule } from './telemetry';

export function configureCommonModules(framework: Framework) {
  configureInfraModules(framework);
  configureCollectionModule(framework);
  configureFeedModule(framework);
  configureNavigationModule(framework);
  configureSubscribeFeedModule(framework);
  configureTagModule(framework);
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
  configureOrganizeModule(framework);
  configureFavoriteModule(framework);
  configureExplorerModule(framework);
}
