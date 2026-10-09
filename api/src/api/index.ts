import { authenticate } from '@/middlewares/auth';
import { Router } from 'express';
import admin from './routes/admin';
import auth from './routes/auth';
import bookings from './routes/bookings';
import carCategories from './routes/car-categories';
import clientErrors from './routes/client-errors';
import cars from './routes/cars';
import carInsurance from './routes/car-insurance';
import roadTax from './routes/road-tax';
import fitnessCertificate from './routes/fitness-certificate';
import deliveryUsers from './routes/delivery-users';
import reports from './routes/reports';
import files from './routes/files';
import invoice from './routes/invoice';
import servicing from './routes/servicing';
import users from './routes/users';

export default () => {
  const app = Router();

  // Public: POST /auth/login must be reachable without a token. /auth/logout
  // and /auth/me gate themselves individually (see routes/auth.ts) since they
  // register on this same pre-`authenticate` router.
  auth(app);

  // Every route registered from here on requires a valid session.
  app.use(authenticate);

  bookings(app);
  carCategories(app);
  cars(app);
  carInsurance(app);
  roadTax(app);
  fitnessCertificate(app);
  deliveryUsers(app);
  reports(app);
  files(app);
  invoice(app);
  servicing(app);
  users(app);
  admin(app);
  clientErrors(app);

  return app;
};
