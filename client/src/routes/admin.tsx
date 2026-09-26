import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';
import { RoleGuard } from 'src/guards/role-guard';

const UsersListPage = lazy(() => import('src/pages/admin/users/index'));
const UsersCreatePage = lazy(() => import('src/pages/admin/users/create'));
const UsersEditPage = lazy(() => import('src/pages/admin/users/[userId]/edit'));
const LoginLogsPage = lazy(() => import('src/pages/admin/login-logs/index'));
const AuditLogsPage = lazy(() => import('src/pages/admin/audit-logs/index'));
const AnalyticsPage = lazy(() => import('src/pages/admin/analytics/index'));

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    element: (
      <DashboardLayout>
        <RoleGuard allowedRoles={['Admin']}>
          <Suspense>
            <Outlet />
          </Suspense>
        </RoleGuard>
      </DashboardLayout>
    ),
    children: [
      {
        path: 'users',
        children: [
          { index: true, element: <UsersListPage /> },
          { path: 'create', element: <UsersCreatePage /> },
          { path: ':userId/edit', element: <UsersEditPage /> }
        ]
      },
      {
        path: 'login-logs',
        element: <LoginLogsPage />
      },
      {
        path: 'audit-logs',
        element: <AuditLogsPage />
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />
      }
    ]
  }
];
