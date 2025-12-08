import { ReportService } from '@/services/report';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
const route = Router();

export default (app: Router) => {
  app.use('/reports', route);

  // Route URL can definitely change if we want to avoid nested API endpoints.
  route.get('/schedule/pickup', (req: Request, res: Response) => {
    const reportService = Container.get(ReportService);
    reportService
      .getPickupScheduleByDate()
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });
};
