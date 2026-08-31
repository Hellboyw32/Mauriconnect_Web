import { requireRole } from '@/middlewares/auth';
import { UserService } from '@/services/user';
import { AuditLogService } from '@/services/audit-log';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/admin', requireRole('Admin'), route);

  route.get('/analytics', (req: Request, res: Response) => {
    const userService = Container.get(UserService);
    const auditLogService = Container.get(AuditLogService);

    Promise.all([
      userService.getUserAnalytics(),
      userService.getLoginAnalytics(),
      auditLogService.getAuditLogs({})
    ])
      .then(([userAnalytics, loginAnalytics, recentActivity]) => {
        res.status(200).json({
          data: {
            users: userAnalytics.data,
            logins: loginAnalytics.data,
            recentActivity: (recentActivity.data || []).slice(0, 10)
          }
        });
      })
      .catch((error) => {
        res.status(500).json({ message: 'Failed to load analytics.', error });
      });
  });
};
