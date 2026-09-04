import { requirePermission, requireReportAccess, validateReportDateRange } from '@/middlewares/auth';
import { ReportService } from '@/services/report';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
const route = Router();

export default (app: Router) => {
  app.use('/reports', requirePermission('Reports', 'View'), route);

  // Route URL can definitely change if we want to avoid nested API endpoints.
  route.get(
    '/schedule/pickup',
    requireReportAccess('DailySchedule'),
    (req: Request, res: Response) => {
      const pickupDate = req.query.pickupdate as string | undefined;

      const dateError = validateReportDateRange(req, [pickupDate ? new Date(pickupDate) : undefined]);
      if (dateError) {
        res.status(403).json({ status: 403, message: dateError, success: false });
        return;
      }

      const reportService = Container.get(ReportService);
      reportService
        .getPickupScheduleByDate(pickupDate)
        .then((result) => {
          res.send(result).status(200);
        })
        .catch((error) => {
          res.send(error).status(500);
        });
    }
  );

  route.get(
    '/schedule/dropoff',
    requireReportAccess('DailySchedule'),
    (req: Request, res: Response) => {
      const dropoffDate = req.query.dropoffdate as string | undefined;

      const dateError = validateReportDateRange(req, [
        dropoffDate ? new Date(dropoffDate) : undefined
      ]);
      if (dateError) {
        res.status(403).json({ status: 403, message: dateError, success: false });
        return;
      }

      const reportService = Container.get(ReportService);
      reportService
        .getDropoffScheduleByDate(dropoffDate)
        .then((result) => {
          res.send(result).status(200);
        })
        .catch((error) => {
          res.send(error).status(500);
        });
    }
  );

  route.get('/simcard', requireReportAccess('SimCard'), (req: Request, res: Response) => {
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

    const dateError = validateReportDateRange(req, [new Date(startDate), new Date(endDate)]);
    if (dateError) {
      res.status(403).json({ status: 403, message: dateError, success: false });
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

  route.get('/insurance', requireReportAccess('Insurance'), (req: Request, res: Response) => {
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

    const dateError = validateReportDateRange(req, [new Date(startDate), new Date(endDate)]);
    if (dateError) {
      res.status(403).json({ status: 403, message: dateError, success: false });
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
