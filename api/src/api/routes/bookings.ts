import { BookingService } from '@/services/booking';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
const route = Router();

export default (app: Router) => {
  app.use('/bookings', route);

  route.get('/', (req: Request, res: Response) => {
    const bookingService = Container.get(BookingService);
    bookingService
      .getBookings()
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

  // TODO: Complete the delete booking functionality
  // route.delete('/:id', (req: Request, res: Response) => {
  //   const bookingId = parseInt(req.params.id);
  //   const bookingService = Container.get(BookingService);
  //   bookingService
  //     .deleteBooking(bookingId, req.body)
  //     .then((result) => {
  //       res.send(result).status(200);
  //     })
  //     .catch((error) => {
  //       res.send(error).status(500);
  //     });
  // });
};
