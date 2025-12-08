import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
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
        <Suspense>
          <Outlet />
        </Suspense>
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
