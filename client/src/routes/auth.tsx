import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router-dom';

import { GuestGuard } from 'src/guards/guest-guard';
import { IssuerGuard } from 'src/guards/issuer-guard';
import { Layout as AuthLayout } from 'src/layouts/auth/modern-layout';
import { Issuer } from 'src/utils/auth';

// JWT
// TODO: Change to our current context for login
const JwtLoginPage = lazy(() => import('src/pages/auth/jwt/login'));

export const authRoutes: RouteObject[] = [
  {
    path: '',
    element: (
      <IssuerGuard issuer={Issuer.JWT}>
        <GuestGuard>
          <AuthLayout>
            <Outlet />
          </AuthLayout>
        </GuestGuard>
      </IssuerGuard>
    ),
    children: [
      {
        index: true,
        element: <JwtLoginPage />
      }
    ]
  }
];
