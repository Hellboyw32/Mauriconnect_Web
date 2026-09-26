import { requirePermission } from '@/middlewares/auth';
import { CarInsuranceService } from '@/services/car-insurance';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/car-insurance', route);
};

// GET /car-insurance?carNumber=X - Get all car insurance records with optional filter
route.get('/', requirePermission('CarInsurance', 'View'), async (req: Request, res: Response) => {
  try {
    const service = Container.get(CarInsuranceService);
    const carNumber = req.query.carNumber as string | undefined;

    const result = await service.getCarInsurances(carNumber);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch car insurance records'
    });
  }
});

// GET /car-insurance/:id - Get single car insurance record by ID
route.get('/:id', requirePermission('CarInsurance', 'View'), async (req: Request, res: Response) => {
  try {
    const service = Container.get(CarInsuranceService);
    const insuranceId = Number(req.params.id);

    if (isNaN(insuranceId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid car insurance ID'
      });
    }

    const result = await service.getCarInsurance(insuranceId);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch car insurance record'
    });
  }
});

// POST /car-insurance - Create new car insurance record
route.post('/', requirePermission('CarInsurance', 'Create'), async (req: Request, res: Response) => {
  try {
    const service = Container.get(CarInsuranceService);
    const data = req.body;

    if (!data.CarId || !data.StartDate || !data.EndDate) {
      return res.status(400).send({
        success: false,
        message: 'CarId, StartDate, and EndDate are required'
      });
    }

    const result = await service.createCarInsurance(data);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to create car insurance record'
    });
  }
});

// PUT /car-insurance/:id - Update existing car insurance record
route.put('/:id', requirePermission('CarInsurance', 'Edit'), async (req: Request, res: Response) => {
  try {
    const service = Container.get(CarInsuranceService);
    const insuranceId = Number(req.params.id);
    const data = req.body;

    if (isNaN(insuranceId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid car insurance ID'
      });
    }

    const result = await service.updateCarInsurance(insuranceId, data);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to update car insurance record'
    });
  }
});

// DELETE /car-insurance/:id - Soft delete car insurance record (set IsActive=false)
route.delete('/:id', requirePermission('CarInsurance', 'Delete'), async (req: Request, res: Response) => {
  try {
    const service = Container.get(CarInsuranceService);
    const insuranceId = Number(req.params.id);
    const createdBy = req.body.createdBy || (req.query.createdBy as string) || 'system';

    if (isNaN(insuranceId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid car insurance ID'
      });
    }

    const result = await service.deleteCarInsurance(insuranceId, createdBy);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to delete car insurance record'
    });
  }
});
