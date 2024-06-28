import { Toaster } from '@affine/admin/components/ui/sonner';
import { Telemetry } from '@affine/core/telemetry';
import { wrapCreateBrowserRouter } from '@sentry/react';
import { useEffect } from 'react';
import {
  createBrowserRouter as reactRouterCreateBrowserRouter,
  RouterProvider,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { TooltipProvider } from './components/ui/tooltip';

const createBrowserRouter = wrapCreateBrowserRouter(
  reactRouterCreateBrowserRouter
);

const _createBrowserRouter = window.SENTRY_RELEASE
  ? createBrowserRouter
  : reactRouterCreateBrowserRouter;

const Redirect = function Redirect() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      navigate('/admin', { replace: true });
    }
  }, [location, navigate]);
  return null;
};

export const router = _createBrowserRouter(
  [
    {
      path: '/',
      element: <Redirect />,
    },
    {
      path: '/admin',
      children: [
        {
          path: '',
          lazy: () => import('./modules/home'),
        },
        {
          path: '/admin/auth',
          lazy: () => import('./modules/auth'),
        },
        {
          path: '/admin/users',
          lazy: () => import('./modules/users'),
        },
      ],
    },
  ],
  {
    future: {
      v7_normalizeFormMethod: true,
    },
  }
);

export const App = () => {
  return (
    <TooltipProvider>
      <Telemetry />
      <RouterProvider router={router} />
      <Toaster />
    </TooltipProvider>
  );
};
