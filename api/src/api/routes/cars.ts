import { CarService } from '@/services/car';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/cars', route);
};

// GET /cars?carNumber=X&categoryId=Y - Get all cars with optional filters
route.get('/', async (req: Request, res: Response) => {
  try {
    const carService = Container.get(CarService);
    const carNumber = req.query.carNumber as string | undefined;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

    const result = await carService.getCars(carNumber, categoryId);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch cars'
    });
  }
});

// GET /cars/:id - Get single car by ID
route.get('/:id', async (req: Request, res: Response) => {
  try {
    const carService = Container.get(CarService);
    const carId = Number(req.params.id);

    if (isNaN(carId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid car ID'
      });
    }

    const result = await carService.getCar(carId);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch car'
    });
  }
});

// POST /cars - Create new car
route.post('/', async (req: Request, res: Response) => {
  try {
    const carService = Container.get(CarService);
    const carData = req.body;

    if (!carData.Model || !carData.CategoryId || !carData.CarNumber) {
      return res.status(400).send({
        success: false,
        message: 'Model, CategoryId, and CarNumber are required'
      });
    }

    const result = await carService.createCar(carData);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to create car'
    });
  }
});

// PUT /cars/:id - Update existing car
route.put('/:id', async (req: Request, res: Response) => {
  try {
    const carService = Container.get(CarService);
    const carId = Number(req.params.id);
    const carData = req.body;

    if (isNaN(carId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid car ID'
      });
    }

    const result = await carService.updateCar(carId, carData);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to update car'
    });
  }
});

// DELETE /cars/:id - Soft delete car (set IsActive=false)
route.delete('/:id', async (req: Request, res: Response) => {
  try {
    const carService = Container.get(CarService);
    const carId = Number(req.params.id);
    const createdBy = req.body.createdBy || (req.query.createdBy as string) || 'system';

    if (isNaN(carId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid car ID'
      });
    }

    const result = await carService.deleteCar(carId, createdBy);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to delete car'
    });
  }
});

// GET /cars/analytics/top-rented - Get top rented cars
route.get('/analytics/top-rented', async (req: Request, res: Response) => {
  try {
    const carService = Container.get(CarService);
    const topCount = req.query.topCount ? Number(req.query.topCount) : 8;

    const result = await carService.getTopRentedCars(topCount);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch top rented cars'
    });
  }
});
