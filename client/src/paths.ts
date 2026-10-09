import { cars } from './mock/car';

export const paths = {
  index: '/',
  auth: {
    jwt: {
      login: '/'
    }
  },

  dashboard: {
    index: '/dashboard',
    analytics: '/dashboard/analytics',
    scheduler: '/dashboard/scheduler'
  },
  bookings: {
    index: '/bookings',
    documents: '/bookings/:bookingId/documents',
    create: '/bookings/create',
    edit: '/bookings/:bookingId/edit'
  },
  cars: {
    index: '/cars',
    create: '/cars/create',
    edit: '/cars/:carId/edit'
  },
  carInsurance: {
    index: '/car-insurance',
    create: '/car-insurance/create',
    edit: '/car-insurance/:carInsuranceId/edit'
  },
  roadTax: {
    index: '/road-tax',
    create: '/road-tax/create',
    edit: '/road-tax/:roadTaxId/edit'
  },
  fitnessCertificate: {
    index: '/fitness-certificate',
    create: '/fitness-certificate/create',
    edit: '/fitness-certificate/:fitnessId/edit'
  },
  carServicing: {
    index: '/car-servicing',
    create: '/car-servicing/create',
    edit: '/car-servicing/:servicingId/edit'
  },
  reports: {
    index: '/reports'
  },
  admin: {
    users: {
      index: '/admin/users',
      create: '/admin/users/create',
      edit: '/admin/users/:userId/edit'
    },
    loginLogs: {
      index: '/admin/login-logs'
    },
    auditLogs: {
      index: '/admin/audit-logs'
    },
    analytics: {
      index: '/admin/analytics'
    }
  }
};
