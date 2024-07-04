import { useMemo } from 'react';

import { PagePropertiesMetaManager } from '../components/affine/page-properties';
import { useCurrentWorkspacePropertiesAdapter } from './use-affine-adapter';

export const usePagePropertiesMetaManager = () => {
  const adapter = useCurrentWorkspacePropertiesAdapter();
  return useMemo(() => new PagePropertiesMetaManager(adapter), [adapter]);
};
