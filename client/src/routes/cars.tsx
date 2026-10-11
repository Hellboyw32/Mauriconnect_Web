import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { PermissionGuard } from 'src/guards/permission-guard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const CarListPage = lazy(() => import('src/pages/cars/index'));
const CarCreatePage = lazy(() => import('src/pages/cars/create'));
const CarEditPage = lazy(() => import('src/pages/cars/[carId]/edit'));
const PsvlCreatePage = lazy(() => import('src/pages/cars/[carId]/psvl/create'));
const PsvlEditPage = lazy(() => import('src/pages/cars/[carId]/psvl/[psvlId]/edit'));

export const carRoutes: RouteObject[] = [
  {
    path: 'cars',
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
        element: <CarListPage />
      },
      {
        path: 'create',
        element: <CarCreatePage />
      },
      {
        path: ':carId/edit',
        element: <CarEditPage />
      },
      {
        path: ':carId/psvl/create',
        element: <PsvlCreatePage />
      },
      {
        path: ':carId/psvl/:psvlId/edit',
        element: <PsvlEditPage />
      }
    ]
  }
];
