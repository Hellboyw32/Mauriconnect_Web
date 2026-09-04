import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { PermissionGuard } from 'src/guards/permission-guard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';
const ReportsLandingPage = lazy(() => import('src/pages/reports/reportsLandingPage'));

export const reportRoutes: RouteObject[] = [
    {
      path: 'reports',
      element: (
        <DashboardLayout>
          <PermissionGuard module="Reports">
            <Suspense>
              <Outlet />
            </Suspense>
          </PermissionGuard>
        </DashboardLayout>
      ),
      children: [
        {
          index: true,
          element: <ReportsLandingPage/>
        }
      ]
    }
  ];
  