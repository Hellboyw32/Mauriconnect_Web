import { CarService } from '@/services/car';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
const route = Router();

export default (app: Router) => {
  app.use('/cars', route);
};

route.get('/', (req: Request, res: Response) => {
  const carService = Container.get(CarService);
  carService
    .getCars()
    .then((result) => {
      res.send(result).status(200);
    })
    .catch((error) => {
      res.send(error).status(500);
    });
});
