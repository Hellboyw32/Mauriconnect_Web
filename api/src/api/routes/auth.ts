import { authenticate } from '@/middlewares/auth';
import { AuthService } from '@/services/auth';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/auth', route);

  route.post('/login', (req: Request, res: Response) => {
    const authService = Container.get(AuthService);
    const { username, password } = req.body || {};

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required.' });
      return;
    }

    authService
      .login(username, password, req.ip, req.headers['user-agent'])
      .then((result) => {
        if (!result.success) {
          res.status(401).json({ message: result.message });
          return;
        }

        res.status(200).json({
          data: {
            accessToken: result.accessToken,
            loginLogId: result.loginLogId,
            user: result.user
          }
        });
      })
      .catch((error) => {
        res.status(500).json({ message: 'Login failed due to a server error.', error });
      });
  });

  route.post('/logout', authenticate, (req: Request, res: Response) => {
    const authService = Container.get(AuthService);
    const loginLogId = req.body?.loginLogId;

    authService
      .logout(loginLogId)
      .then(() => res.status(200).json({ message: 'Logged out.' }))
      .catch((error) => res.status(500).json({ message: 'Logout failed.', error }));
  });

  route.get('/me', authenticate, (req: Request, res: Response) => {
    const authService = Container.get(AuthService);

    authService
      .getMe(req.user.userId)
      .then((user) => {
        if (!user) {
          res.status(404).json({ message: 'User not found.' });
          return;
        }

        res.status(200).json({ data: user });
      })
      .catch((error) => {
        res.status(500).json({ message: 'Failed to load current user.', error });
      });
  });
};
