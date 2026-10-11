import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { PermissionGuard } from 'src/guards/permission-guard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const PsvlListPage = lazy(() => import('src/pages/psvl/index'));

// PSVL belongs to the Cars module, so it is gated by Cars permissions.
export const psvlRoutes: RouteObject[] = [
  {
    path: 'psvl',
    element: (
      <DashboardLayout>
        <PermissionGuard module="Cars">
          <Suspense>
            <Outlet />
          </Suspense>
        </PermissionGuard>
      </DashboardLayout>
    ),
    children: [
      {
        index: true,
        element: <PsvlListPage />
      }
    ]
  }
];
