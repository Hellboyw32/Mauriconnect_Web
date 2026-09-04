import { Router } from 'express';
import bookings from './routes/bookings';
import carCategories from './routes/car-categories';
import cars from './routes/cars';
import carInsurance from './routes/car-insurance';
import roadTax from './routes/road-tax';
import fitnessCertificate from './routes/fitness-certificate';
import deliveryUsers from './routes/delivery-users';
import reports from './routes/reports';
import files from './routes/files';
import invoice from './routes/invoice';
import servicing from './routes/servicing';

export default () => {
  const app = Router();
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

  return app;
};
