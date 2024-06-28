import { FavoriteItemsAdapter } from '@affine/core/modules/properties';
import { ShareDocsService } from '@affine/core/modules/share-doc';
import type { Collection, Filter } from '@affine/env/filter';
import { PublicPageMode } from '@affine/graphql';
import type { DocMeta } from '@blocksuite/store';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useMemo } from 'react';

import { filterPage, filterPageByRules } from './use-collection-manager';

export const useFilteredPageMetas = (
  pageMetas: DocMeta[],
  options: {
    trash?: boolean;
    filters?: Filter[];
    collection?: Collection;
  } = {}
) => {
  const shareDocsService = useService(ShareDocsService);
  const shareDocs = useLiveData(shareDocsService.shareDocs?.list$);

  const getPublicMode = useCallback(
    (id: string) => {
      const mode = shareDocs?.find(shareDoc => shareDoc.id === id)?.mode;
      return mode
        ? mode === PublicPageMode.Edgeless
          ? ('edgeless' as const)
          : ('page' as const)
        : undefined;
    },
    [shareDocs]
  );

  useEffect(() => {
    // TODO(@eyhn): loading & error UI
    shareDocsService.shareDocs?.revalidate();
  }, [shareDocsService]);

  const favAdapter = useService(FavoriteItemsAdapter);
  const favoriteItems = useLiveData(favAdapter.favorites$);

  const filteredPageMetas = useMemo(
    () =>
      pageMetas.filter(pageMeta => {
        if (options.trash) {
          if (!pageMeta.trash) {
            return false;
          }
        } else if (pageMeta.trash) {
          return false;
        }
        const pageData = {
          meta: pageMeta,
          favorite: favoriteItems.some(fav => fav.id === pageMeta.id),
          publicMode: getPublicMode(pageMeta.id),
        };
        if (
          options.filters &&
          !filterPageByRules(options.filters, [], pageData)
        ) {
          return false;
        }

        if (options.collection && !filterPage(options.collection, pageData)) {
          return false;
        }

        return true;
      }),
    [
      pageMetas,
      options.trash,
      options.filters,
      options.collection,
      favoriteItems,
      getPublicMode,
    ]
  );

  return filteredPageMetas;
};
