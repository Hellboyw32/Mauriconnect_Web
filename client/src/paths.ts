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
    analytics: '/dashboard/analytics'
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
  reports: {
    index: '/reports'
  }
};
