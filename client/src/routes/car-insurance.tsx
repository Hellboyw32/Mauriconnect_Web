import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const CarInsuranceListPage = lazy(() => import('src/pages/car-insurance/index'));
const CarInsuranceCreatePage = lazy(() => import('src/pages/car-insurance/create'));
const CarInsuranceEditPage = lazy(() => import('src/pages/car-insurance/[carInsuranceId]/edit'));

export const carInsuranceRoutes: RouteObject[] = [
  {
    path: 'car-insurance',
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
        element: <CarInsuranceListPage />
      },
      {
        path: 'create',
        element: <CarInsuranceCreatePage />
      },
      {
        path: ':carInsuranceId/edit',
        element: <CarInsuranceEditPage />
      }
    ]
  }
];
