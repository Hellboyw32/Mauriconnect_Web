import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const CarListPage = lazy(() => import('src/pages/cars/index'));
const CarCreatePage = lazy(() => import('src/pages/cars/create'));
const CarEditPage = lazy(() => import('src/pages/cars/[carId]/edit'));

export const carRoutes: RouteObject[] = [
  {
    path: 'cars',
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
        element: <CarListPage />
      },
      {
        path: 'create',
        element: <CarCreatePage />
      },
      {
        path: ':carId/edit',
        element: <CarEditPage />
      }
    ]
  }
];
