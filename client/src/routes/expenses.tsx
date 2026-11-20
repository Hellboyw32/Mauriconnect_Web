import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';
import { PermissionGuard } from 'src/guards/permission-guard';
import { RoleGuard } from 'src/guards/role-guard';
import { Layout as DashboardLayout } from 'src/layouts/dashboard';

const ExpenseListPage = lazy(() => import('src/pages/expenses/index'));
const ExpenseCreatePage = lazy(() => import('src/pages/expenses/create'));
const ExpenseEditPage = lazy(() => import('src/pages/expenses/[expenseId]/edit'));
const ExpenseReportPage = lazy(() => import('src/pages/expenses/report'));

// Everyone with the Expenses permission can record and see their own expenses;
// the VAT report is Admin-only (and enforced again by the API).
export const expenseRoutes: RouteObject[] = [
  {
    path: 'expenses',
    element: (
      <DashboardLayout>
        <PermissionGuard module="Expenses">
          <Suspense>
            <Outlet />
          </Suspense>
        </PermissionGuard>
      </DashboardLayout>
    ),
    children: [
      {
        index: true,
        element: <ExpenseListPage />
      },
      {
        path: 'create',
        element: <ExpenseCreatePage />
      },
      {
        path: ':expenseId/edit',
        element: <ExpenseEditPage />
      },
      {
        path: 'report',
        element: (
          <RoleGuard allowedRoles={['Admin']}>
            <ExpenseReportPage />
          </RoleGuard>
        )
      }
    ]
  }
];
