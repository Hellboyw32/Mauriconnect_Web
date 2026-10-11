import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { adminRoutes } from './admin';
import { authRoutes } from './auth';
import { bookingRoutes } from './bookings';
import { carRoutes } from './cars';
import { carInsuranceRoutes } from './car-insurance';
import { psvlRoutes } from './psvl';
import { roadTaxRoutes } from './road-tax';
import { fitnessCertificateRoutes } from './fitness-certificate';
import { carServicingRoutes } from './car-servicing';
import { reportRoutes } from './reports';
import { dashboardRoutes } from './dashboard';

const Error401Page = lazy(() => import('src/pages/401'));
const Error404Page = lazy(() => import('src/pages/404'));
const Error500Page = lazy(() => import('src/pages/500'));

export const routes: RouteObject[] = [
  ...authRoutes,
  ...adminRoutes,
  ...bookingRoutes,
  ...carRoutes,
  ...carInsuranceRoutes,
  ...psvlRoutes,
  ...roadTaxRoutes,
  ...fitnessCertificateRoutes,
  ...carServicingRoutes,
  ...reportRoutes,
  ...dashboardRoutes,
  {
    path: '401',
    element: <Error401Page />
  },
  {
    path: '404',
    element: <Error404Page />
  },
  {
    path: '500',
    element: <Error500Page />
  },
  {
    path: '*',
    element: <Error404Page />
  }
];
