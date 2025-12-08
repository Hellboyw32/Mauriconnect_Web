import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';

import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const OverviewPage = lazy(() => import('src/pages/dashboard/index'));

// Other
const AnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: (
      <DashboardLayout>
        <Suspense>
          <Outlet />
        </Suspense>
      </DashboardLayout>
    ),
    children: [
      {
        index: true,
        element: <OverviewPage />
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />
      }
    ]
  }
];
