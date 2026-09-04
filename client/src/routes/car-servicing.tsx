import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const CarServicingListPage = lazy(() => import('src/pages/car-servicing/index'));
const CarServicingCreatePage = lazy(() => import('src/pages/car-servicing/create'));
const CarServicingEditPage = lazy(() => import('src/pages/car-servicing/[servicingId]/edit'));

export const carServicingRoutes: RouteObject[] = [
  {
    path: 'car-servicing',
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
        element: <CarServicingListPage />
      },
      {
        path: 'create',
        element: <CarServicingCreatePage />
      },
      {
        path: ':servicingId/edit',
        element: <CarServicingEditPage />
      }
    ]
  }
];
