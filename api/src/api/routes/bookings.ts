import { requirePermission } from '@/middlewares/auth';
import { BookingService } from '@/services/booking';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
const route = Router();

export default (app: Router) => {
  app.use('/bookings', route);

  // Dashboard summary counts intentionally aren't permission-gated - they
  // back the always-visible Overview page, not the Bookings module itself.

  route.get('/', requirePermission('Bookings', 'View'), (req: Request, res: Response) => {
    const bookingService = Container.get(BookingService);
    const customerName = req.query.customerName as string | undefined;
    const pickupDate = req.query.pickupDate as string | undefined;
    const dropoffDate = req.query.dropoffDate as string | undefined;
    const referenceNo = req.query.referenceNo as string | undefined;
    const carNumber = req.query.carNumber as string | undefined;
    const topCount = req.query.topCount ? parseInt(req.query.topCount as string) : 50;

    bookingService
      .getBookings(customerName, pickupDate, dropoffDate, referenceNo, carNumber, topCount)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/today/count', (req: Request, res: Response) => {
    const bookingService = Container.get(BookingService);
    bookingService
      .getBookingsTodayCount()
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/dropoffs/today/count', (req: Request, res: Response) => {
    const bookingService = Container.get(BookingService);
    bookingService
      .getDropoffsTodayCount()
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/pickups/today/count', (req: Request, res: Response) => {
    const bookingService = Container.get(BookingService);
    bookingService
      .getPickupsTodayCount()
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/recent/:limit?', (req: Request, res: Response) => {
    const limit = req.params.limit ? parseInt(req.params.limit) : undefined;
    const bookingService = Container.get(BookingService);
    bookingService
      .getRecentBookings(limit)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/week/current', (req: Request, res: Response) => {
    const bookingService = Container.get(BookingService);
    bookingService
      .getBookingsCurrentWeek()
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/:id', requirePermission('Bookings', 'View'), (req: Request, res: Response) => {
    const bookingId = parseInt(req.params.id);
    const bookingService = Container.get(BookingService);
    bookingService
      .getBooking(bookingId)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.post('/', requirePermission('Bookings', 'Create'), (req: Request, res: Response) => {
    const bookingService = Container.get(BookingService);
    bookingService
      .createBooking(req.body)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.put('/:id', requirePermission('Bookings', 'Edit'), (req: Request, res: Response) => {
    const bookingId = parseInt(req.params.id);
    const bookingService = Container.get(BookingService);
    bookingService
      .updateBooking(bookingId, req.body)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.delete('/:id', requirePermission('Bookings', 'Delete'), (req: Request, res: Response) => {
    const bookingId = parseInt(req.params.id);
    const bookingService = Container.get(BookingService);
    bookingService
      .deleteBooking(bookingId, req.body)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });
};
