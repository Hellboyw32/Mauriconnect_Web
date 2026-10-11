import { requirePermission } from '@/middlewares/auth';
import { PsvlService } from '@/services/psvl';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/psvl', route);
};

// PSVL is a sub-section of a car (edited from the car's edit page), so it is
// gated by the Cars module rather than having a permission module of its own.

// GET /psvl?carId=X - Get active PSVL records, optionally for one car
route.get('/', requirePermission('Cars', 'View'), async (req: Request, res: Response) => {
  try {
    const carId = req.query.carId ? Number(req.query.carId) : undefined;

    if (carId !== undefined && isNaN(carId)) {
      return res.status(400).send({ success: false, message: 'Invalid car ID' });
    }

    const result = await Container.get(PsvlService).getPsvls(carId);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch PSVL records'
    });
  }
});

// GET /psvl/:id - Get single PSVL record
route.get('/:id', requirePermission('Cars', 'View'), async (req: Request, res: Response) => {
  try {
    const psvlId = Number(req.params.id);

    if (isNaN(psvlId)) {
      return res.status(400).send({ success: false, message: 'Invalid PSVL ID' });
    }

    const result = await Container.get(PsvlService).getPsvl(psvlId);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch PSVL record'
    });
  }
});

// POST /psvl - Create PSVL record
route.post('/', requirePermission('Cars', 'Edit'), async (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (!data.CarId || !data.StartDate || !data.EndDate) {
      return res.status(400).send({
        success: false,
        message: 'CarId, StartDate, and EndDate are required'
      });
    }

    const result = await Container.get(PsvlService).createPsvl(data);
    res.status(result.success ? 201 : result.status).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to create PSVL record'
    });
  }
});

// PUT /psvl/:id - Update PSVL record (start date, end date, company, notes)
route.put('/:id', requirePermission('Cars', 'Edit'), async (req: Request, res: Response) => {
  try {
    const psvlId = Number(req.params.id);
    const data = req.body;

    if (isNaN(psvlId)) {
      return res.status(400).send({ success: false, message: 'Invalid PSVL ID' });
    }

    if (!data.CarId || !data.StartDate || !data.EndDate) {
      return res.status(400).send({
        success: false,
        message: 'CarId, StartDate, and EndDate are required'
      });
    }

    const result = await Container.get(PsvlService).updatePsvl(psvlId, data);
    res.status(result.success ? 200 : result.status).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to update PSVL record'
    });
  }
});

// DELETE /psvl/:id - Soft delete PSVL record (IsActive = 0)
route.delete('/:id', requirePermission('Cars', 'Edit'), async (req: Request, res: Response) => {
  try {
    const psvlId = Number(req.params.id);
    const createdBy = req.body?.createdBy || (req.query.createdBy as string) || 'system';

    if (isNaN(psvlId)) {
      return res.status(400).send({ success: false, message: 'Invalid PSVL ID' });
    }

    const result = await Container.get(PsvlService).deletePsvl(psvlId, createdBy);
    res.status(result.success ? 200 : result.status).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to delete PSVL record'
    });
  }
});
