import { Router } from 'express';
import bookings from './routes/bookings';
import carCategories from './routes/car-categories';
import cars from './routes/cars';
import deliveryUsers from './routes/delivery-users';
import reports from './routes/reports';
import files from './routes/files';

export default () => {
  const app = Router();
  bookings(app);
  carCategories(app);
  cars(app);
  deliveryUsers(app);
  reports(app);
  files(app);

  return app;
};
