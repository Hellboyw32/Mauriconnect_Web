import { requireRole } from '@/middlewares/auth';
import { AuditLogService } from '@/services/audit-log';
import { UserService } from '@/services/user';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/users', requireRole('Admin'), route);

  route.get('/', (req: Request, res: Response) => {
    const userService = Container.get(UserService);
    const username = req.query.username as string | undefined;
    const userType = req.query.userType as string | undefined;
    const status = req.query.status as string | undefined;

    userService
      .getUsers({ username, userType, status })
      .then((result) => res.status(result.status).json(result))
      .catch((error) => res.status(500).json({ message: 'Failed to load users.', error }));
  });

  route.get('/logs', (req: Request, res: Response) => {
    const auditLogService = Container.get(AuditLogService);
    const username = req.query.username as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const loginSuccessfulRaw = req.query.loginSuccessful as string | undefined;
    const loginSuccessful =
      loginSuccessfulRaw === undefined ? undefined : loginSuccessfulRaw === 'true';

    auditLogService
      .getUserLoginLogs({ username, fromDate, toDate, loginSuccessful })
      .then((result) => res.status(result.status).json(result))
      .catch((error) => res.status(500).json({ message: 'Failed to load login logs.', error }));
  });

  route.get('/audit-logs', (req: Request, res: Response) => {
    const auditLogService = Container.get(AuditLogService);
    const username = req.query.username as string | undefined;
    const action = req.query.action as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    auditLogService
      .getAuditLogs({ username, action, fromDate, toDate })
      .then((result) => res.status(result.status).json(result))
      .catch((error) => res.status(500).json({ message: 'Failed to load audit logs.', error }));
  });

  route.get('/:id', (req: Request, res: Response) => {
    const userService = Container.get(UserService);
    const userId = parseInt(req.params.id);

    userService
      .getUser(userId)
      .then((result) => res.status(result.status).json(result))
      .catch((error) => res.status(500).json({ message: 'Failed to load user.', error }));
  });

  route.post('/', (req: Request, res: Response) => {
    const userService = Container.get(UserService);

    userService
      .createUser(req.body, { userId: req.user.userId, username: req.user.username })
      .then((result) => res.status(result.status).json(result))
      .catch((error) => res.status(500).json({ message: 'Failed to create user.', error }));
  });

  route.put('/:id', (req: Request, res: Response) => {
    const userService = Container.get(UserService);
    const userId = parseInt(req.params.id);

    userService
      .updateUser(userId, req.body, { userId: req.user.userId, username: req.user.username })
      .then((result) => res.status(result.status).json(result))
      .catch((error) => res.status(500).json({ message: 'Failed to update user.', error }));
  });

  route.post('/:id/lock', (req: Request, res: Response) => {
    const userService = Container.get(UserService);
    const userId = parseInt(req.params.id);

    userService
      .lockUser(userId, { userId: req.user.userId, username: req.user.username })
      .then((result) => res.status(result.status).json(result))
      .catch((error) => res.status(500).json({ message: 'Failed to lock user.', error }));
  });

  route.post('/:id/unlock', (req: Request, res: Response) => {
    const userService = Container.get(UserService);
    const userId = parseInt(req.params.id);

    userService
      .unlockUser(userId, { userId: req.user.userId, username: req.user.username })
      .then((result) => res.status(result.status).json(result))
      .catch((error) => res.status(500).json({ message: 'Failed to unlock user.', error }));
  });

  route.post('/:id/change-password', (req: Request, res: Response) => {
    const userService = Container.get(UserService);
    const userId = parseInt(req.params.id);
    const { password } = req.body || {};

    if (!password) {
      res.status(400).json({ message: 'Password is required.' });
      return;
    }

    userService
      .changePassword(userId, password, { userId: req.user.userId, username: req.user.username })
      .then((result) => res.status(result.status).json(result))
      .catch((error) => res.status(500).json({ message: 'Failed to change password.', error }));
  });
};
