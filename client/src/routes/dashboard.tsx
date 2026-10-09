import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';

import { PermissionGuard } from 'src/guards/permission-guard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const OverviewPage = lazy(() => import('src/pages/dashboard/index'));

// Other
const SchedulerPage = lazy(() => import('src/pages/dashboard/scheduler'));
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
        path: 'scheduler',
        element: (
          <PermissionGuard module="Scheduler">
            <SchedulerPage />
          </PermissionGuard>
        )
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />
      }
    ]
  }
];
