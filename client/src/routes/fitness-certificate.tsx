import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const FitnessCertificateListPage = lazy(() => import('src/pages/fitness-certificate/index'));
const FitnessCertificateCreatePage = lazy(() => import('src/pages/fitness-certificate/create'));
const FitnessCertificateEditPage = lazy(
  () => import('src/pages/fitness-certificate/[fitnessId]/edit')
);

export const fitnessCertificateRoutes: RouteObject[] = [
  {
    path: 'fitness-certificate',
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
        element: <FitnessCertificateListPage />
      },
      {
        path: 'create',
        element: <FitnessCertificateCreatePage />
      },
      {
        path: ':fitnessId/edit',
        element: <FitnessCertificateEditPage />
      }
    ]
  }
];
