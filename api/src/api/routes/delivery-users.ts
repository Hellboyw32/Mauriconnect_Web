import { DeliveryUserService } from '@/services/delivery-user';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
const route = Router();

export default (app: Router) => {
  app.use('/delivery-users', route);

  route.get('/', (req: Request, res: Response) => {
    const deliveryUserService = Container.get(DeliveryUserService);
    deliveryUserService
      .getDeliveryUsers()
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });
};
