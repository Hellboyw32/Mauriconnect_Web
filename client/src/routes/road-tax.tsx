import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { PermissionGuard } from 'src/guards/permission-guard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const RoadTaxListPage = lazy(() => import('src/pages/road-tax/index'));
const RoadTaxCreatePage = lazy(() => import('src/pages/road-tax/create'));
const RoadTaxEditPage = lazy(() => import('src/pages/road-tax/[roadTaxId]/edit'));

export const roadTaxRoutes: RouteObject[] = [
  {
    path: 'road-tax',
    element: (
      <DashboardLayout>
        <PermissionGuard module="RoadTax">
          <Suspense>
            <Outlet />
          </Suspense>
        </PermissionGuard>
      </DashboardLayout>
    ),
    children: [
      {
        index: true,
        element: <RoadTaxListPage />
      },
      {
        path: 'create',
        element: <RoadTaxCreatePage />
      },
      {
        path: ':roadTaxId/edit',
        element: <RoadTaxEditPage />
      }
    ]
  }
];
