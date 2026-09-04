import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { PermissionGuard } from 'src/guards/permission-guard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const BookingListPage = lazy(() => import('src/pages/bookings/list'));
const BookingDocumentsListPage = lazy(() => import('src/pages/bookings/documents/list'));
const BookingCreatePage = lazy(() => import('src/pages/bookings/create'));
const BookingEditPage = lazy(() => import('src/pages/bookings/edit'));

export const bookingRoutes: RouteObject[] = [
  {
    path: 'bookings',
    element: (
      <DashboardLayout>
        <PermissionGuard module="Bookings">
          <Suspense>
            <Outlet />
          </Suspense>
        </PermissionGuard>
      </DashboardLayout>
    ),
    children: [
      {
        index: true,
        element: <BookingListPage />
      },
      {
        path: ':bookingId/documents',
        element: <BookingDocumentsListPage />
      },
      {
        path: 'create',
        element: <BookingCreatePage />
      },
      {
        path: ':bookingId/edit',
        element: <BookingEditPage />
      }
    ]
  }
];
