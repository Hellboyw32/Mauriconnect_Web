import { BookingService } from '@/services/booking';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
const route = Router();

export default (app: Router) => {
  app.use('/bookings', route);

  route.get('/', (req: Request, res: Response) => {
    const bookingService = Container.get(BookingService);
    const customerName = req.query.customerName as string | undefined;
    const pickupDate = req.query.pickupDate as string | undefined;
    const dropoffDate = req.query.dropoffDate as string | undefined;

    bookingService
      .getBookings(customerName, pickupDate, dropoffDate)
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

  route.get('/:id', (req: Request, res: Response) => {
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

  route.post('/', (req: Request, res: Response) => {
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

  route.put('/:id', (req: Request, res: Response) => {
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

  route.delete('/:id', (req: Request, res: Response) => {
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
