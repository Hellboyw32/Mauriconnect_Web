import { ReportService } from '@/services/report';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
const route = Router();

export default (app: Router) => {
  app.use('/reports', route);

  // Route URL can definitely change if we want to avoid nested API endpoints.
  route.get('/schedule/pickup', (req: Request, res: Response) => {
    const pickupDate = req.query.pickupdate as string | undefined;
    const reportService = Container.get(ReportService);
    reportService
      .getPickupScheduleByDate(pickupDate)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/schedule/dropoff', (req: Request, res: Response) => {
    const dropoffDate = req.query.dropoffdate as string | undefined;
    const reportService = Container.get(ReportService);
    reportService
      .getDropoffScheduleByDate(dropoffDate)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });
};
