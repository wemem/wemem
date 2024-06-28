import { RightSidebarService } from '@affine/core/modules/right-sidebar';
import { WorkbenchService } from '@affine/core/modules/workbench';
import { ViewService } from '@affine/core/modules/workbench/services/view';
import { useViewPosition } from '@affine/core/modules/workbench/view/use-view-position';
import { DocService, useLiveData, useService } from '@toeverything/infra';

export const useDetailPageHeaderResponsive = () => {
  const mode = useLiveData(useService(DocService).doc.mode$);

  const view = useService(ViewService).view;
  const workbench = useService(WorkbenchService).workbench;
  const availableWidth = useLiveData(view.headerContentWidth$);
  const viewPosition = useViewPosition();
  const workbenchViewsCount = useLiveData(
    workbench.views$.map(views => views.length)
  );
  const rightSidebar = useService(RightSidebarService).rightSidebar;
  const rightSidebarOpen = useLiveData(rightSidebar.isOpen$);

  // share button should be hidden once split-view is enabled
  const hideShare = availableWidth < 500 || workbenchViewsCount > 1;
  const hidePresent = availableWidth < 400 || mode !== 'edgeless';
  const hideCollect = availableWidth < 300;
  const hideToday = availableWidth < 300;

  const showDivider =
    viewPosition.isLast && !rightSidebarOpen && !(hidePresent && hideShare);

  return {
    hideShare,
    hidePresent,
    hideCollect,
    hideToday,
    showDivider,
  };
};
