import { requirePermission } from '@/middlewares/auth';
import { SchedulerService } from '@/services/scheduler';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/scheduler', route);
};

// GET /scheduler - categories, their cars and the bookings in the dashboard
// window (5 months back / 7 months ahead). Backs the
// Scheduler page (gated by the Scheduler:View permission).
route.get('/', requirePermission('Scheduler', 'View'), async (_req: Request, res: Response) => {
  try {
    const result = await Container.get(SchedulerService).getSchedulerData();
    res.status(result.success ? 200 : 500).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch scheduler data'
    });
  }
});
