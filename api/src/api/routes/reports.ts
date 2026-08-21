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

  route.get('/simcard', (req: Request, res: Response) => {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!startDate || !endDate) {
      res.send({
        status: 400,
        message: 'startDate and endDate are required',
        success: false
      }).status(400);
      return;
    }

    const reportService = Container.get(ReportService);
    reportService
      .getSimCardReport(startDate, endDate)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/insurance', (req: Request, res: Response) => {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!startDate || !endDate) {
      res.send({
        status: 400,
        message: 'startDate and endDate are required',
        success: false
      }).status(400);
      return;
    }

    const reportService = Container.get(ReportService);
    reportService
      .getInsuranceReport(startDate, endDate)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });
};
