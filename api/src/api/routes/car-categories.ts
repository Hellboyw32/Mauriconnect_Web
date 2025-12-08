import { CarCategoryService } from '@/services/car-category';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';
const route = Router();

export default (app: Router) => {
  app.use('/car-categories', route);

  route.get('/', (req: Request, res: Response) => {
    const carCategoryService = Container.get(CarCategoryService);
    carCategoryService
      .getCarCategories()
      .then((result) => {
        res.send(result).status(200);
      })
      .catch((error) => {
        res.send(error).status(500);
      });
  });
};
