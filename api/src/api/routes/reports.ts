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

  // GET /reports/settlement?date=yyyy-MM-dd - settlement sheet for the bookings
  // picked up on that day (client, car, drop-off, amount, pay mode, agent, remarks).
  // The validated ?date= for the settlement routes, or null once an error response is sent.
  const parseSettlementDate = (req: Request, res: Response): string | null => {
    const date = req.query.date as string | undefined;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date).getTime())) {
      res.status(400).json({
        status: 400,
        message: 'date is required (yyyy-MM-dd)',
        success: false
      });
      return null;
    }

    const dateError = validateReportDateRange(req, [new Date(date)]);
    if (dateError) {
      res.status(403).json({ status: 403, message: dateError, success: false });
      return null;
    }

    return date;
  };

  route.get('/settlement', requireReportAccess('Settlement'), (req: Request, res: Response) => {
    const date = parseSettlementDate(req, res);
    if (!date) return;

    Container.get(ReportService)
      .getSettlementReport(date)
      .then((result) => {
        res.status(result.success ? 200 : 500).send(result);
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  });

  // GET /reports/settlement/export?date=yyyy-MM-dd - the settlement report as an .xlsx file
  route.get('/settlement/export', requireReportAccess('Settlement'), async (req: Request, res: Response) => {
    const date = parseSettlementDate(req, res);
    if (!date) return;

    try {
      const service = Container.get(ReportService);
      const result = await service.getSettlementReport(date);

      if (!result.success) {
        res.status(500).send(result);
        return;
      }

      const buffer = await service.buildSettlementWorkbook(result.data);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Settlement_Report_${date}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).send({ status: 500, message: 'Failed to export the settlement report', success: false });
    }
  });

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

  route.get('/road-tax-renewals', (req: Request, res: Response) => {
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      return res.status(400).send({
        success: false,
        message: 'year and month query params are required'
      });
    }

    const reportService = Container.get(ReportService);
    reportService
      .getRoadTaxRenewalsByMonth(year, month)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/car-fitness-renewals', (req: Request, res: Response) => {
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      return res.status(400).send({
        success: false,
        message: 'year and month query params are required'
      });
    }

    const reportService = Container.get(ReportService);
    reportService
      .getCarFitnessRenewalsByMonth(year, month)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });

  route.get('/car-insurance-renewals', (req: Request, res: Response) => {
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      return res.status(400).send({
        success: false,
        message: 'year and month query params are required'
      });
    }

    const reportService = Container.get(ReportService);
    reportService
      .getCarInsuranceRenewalsByMonth(year, month)
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });
};
