import type { RouteObject } from 'react-router-dom';

export const workbenchRoutes = [
  {
    path: '/all',
    lazy: () => import('./pages/workspace/all-page/all-page'),
  },
  {
    path: '/collection',
    lazy: () => import('./pages/workspace/all-collection'),
  },
  {
    path: '/collection/:collectionId',
    lazy: () => import('./pages/workspace/collection/index'),
  },
  {
    path: '/tag',
    lazy: () => import('./pages/workspace/all-tag'),
  },
  {
    path: '/tag/:tagId',
    lazy: () => import('./pages/workspace/tag'),
  },
  {
    path: '/trash',
    lazy: () => import('./pages/workspace/trash-page'),
  },
  {
    path: '/:pageId',
    lazy: () => import('./pages/workspace/detail-page/detail-page'),
  },
  {
    path: '/feed/:feedId?/:status/:pageId?',
    lazy: () => import('./pages/workspace/all-feed/index'),
  },
  {
    path: '/feed/:feedId/page/:pageId',
    lazy: () => import('./pages/workspace/detail-page/detail-page'),
  },
  {
    path: '/home',
    lazy: () => import('./pages/workspace/home'),
  },
  {
    path: '*',
    lazy: () => import('./pages/404'),
  },
] satisfies RouteObject[];
