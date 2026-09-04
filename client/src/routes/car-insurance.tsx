import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { PermissionGuard } from 'src/guards/permission-guard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const CarInsuranceListPage = lazy(() => import('src/pages/car-insurance/index'));
const CarInsuranceCreatePage = lazy(() => import('src/pages/car-insurance/create'));
const CarInsuranceEditPage = lazy(() => import('src/pages/car-insurance/[carInsuranceId]/edit'));

export const carInsuranceRoutes: RouteObject[] = [
  {
    path: 'car-insurance',
    element: (
      <DashboardLayout>
        <PermissionGuard module="CarInsurance">
          <Suspense>
            <Outlet />
          </Suspense>
        </PermissionGuard>
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
