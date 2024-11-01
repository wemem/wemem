import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/properties';
import { ShareDocsListService } from '@affine/core/modules/share-doc';
import type { Collection, Filter } from '@affine/env/filter';
import { PublicPageMode } from '@affine/graphql';
import type { DocMeta } from '@blocksuite/affine/store';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useMemo } from 'react';

import { filterPage, filterPageByRules } from './use-collection-manager';

export const useFilteredPageMetas = (
  pageMetas: DocMeta[],
  options: {
    trash?: boolean;
    filters?: Filter[];
    collection?: Collection;
    feedFilter?: {
      feedUrl: string;
      read?: boolean;
    };
  } = {}
) => {
  const shareDocsListService = useService(ShareDocsListService);
  const shareDocs = useLiveData(shareDocsListService.shareDocs?.list$);

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
    shareDocsListService.shareDocs?.revalidate();
  }, [shareDocsListService]);

  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
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

        // Add feed filter logic
        if (options.feedFilter) {
          const { feedUrl, read } = options.feedFilter;
          // Check if page has matching feed URL
          if (pageMeta.feedUrl !== feedUrl) {
            return false;
          }
          // If read status is specified, filter by it
          if (read !== undefined) {
            const isRead = Boolean(pageMeta.read);
            if (isRead !== read) {
              return false;
            }
          }
        }

        return true;
      }),
    [
      pageMetas,
      options.trash,
      options.filters,
      options.collection,
      options.feedFilter,
      favoriteItems,
      getPublicMode,
    ]
  );

  return filteredPageMetas;
};
