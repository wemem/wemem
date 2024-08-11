import { WorkbenchService } from '@affine/core/modules/workbench';
import { useViewPosition } from '@affine/core/modules/workbench/view/use-view-position';
import { DocService, useLiveData, useService } from '@toeverything/infra';

export const useDetailPageHeaderResponsive = (availableWidth: number) => {
  const mode = useLiveData(useService(DocService).doc.mode$);

  const workbench = useService(WorkbenchService).workbench;
  const viewPosition = useViewPosition();
  const workbenchViewsCount = useLiveData(
    workbench.views$.map(views => views.length)
  );
  const rightSidebarOpen = useLiveData(workbench.sidebarOpen$);

  // share button should be hidden once split-view is enabled
  const hideShare = availableWidth < 500 || workbenchViewsCount > 1;
  const hidePresent = availableWidth < 400 || mode !== 'edgeless';
  const hideCollect = availableWidth < 300;
  const hideToday = availableWidth < 300;

  const showDivider =
    viewPosition.isLast &&
    !rightSidebarOpen &&
    !(hidePresent && hideShare) &&
    !environment.isDesktop;

  return {
    hideShare,
    hidePresent,
    hideCollect,
    hideToday,
    showDivider,
  };
};
