import { RoadTaxService } from '@/services/road-tax';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/road-tax', route);
};

// GET /road-tax?carNumber=X - Get all road tax records with optional filter
route.get('/', async (req: Request, res: Response) => {
  try {
    const service = Container.get(RoadTaxService);
    const carNumber = req.query.carNumber as string | undefined;

    const result = await service.getRoadTaxes(carNumber);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch road tax records'
    });
  }
});

// GET /road-tax/:id - Get single road tax record by ID
route.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = Container.get(RoadTaxService);
    const roadTaxId = Number(req.params.id);

    if (isNaN(roadTaxId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid road tax ID'
      });
    }

    const result = await service.getRoadTax(roadTaxId);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch road tax record'
    });
  }
});

// POST /road-tax - Create new road tax record
route.post('/', async (req: Request, res: Response) => {
  try {
    const service = Container.get(RoadTaxService);
    const data = req.body;

    if (!data.CarId || !data.StartDate || !data.EndDate) {
      return res.status(400).send({
        success: false,
        message: 'CarId, StartDate, and EndDate are required'
      });
    }

    const result = await service.createRoadTax(data);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to create road tax record'
    });
  }
});

// PUT /road-tax/:id - Update existing road tax record
route.put('/:id', async (req: Request, res: Response) => {
  try {
    const service = Container.get(RoadTaxService);
    const roadTaxId = Number(req.params.id);
    const data = req.body;

    if (isNaN(roadTaxId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid road tax ID'
      });
    }

    const result = await service.updateRoadTax(roadTaxId, data);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to update road tax record'
    });
  }
});

// DELETE /road-tax/:id - Soft delete road tax record (set IsActive=false)
route.delete('/:id', async (req: Request, res: Response) => {
  try {
    const service = Container.get(RoadTaxService);
    const roadTaxId = Number(req.params.id);
    const createdBy = req.body.createdBy || (req.query.createdBy as string) || 'system';

    if (isNaN(roadTaxId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid road tax ID'
      });
    }

    const result = await service.deleteRoadTax(roadTaxId, createdBy);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to delete road tax record'
    });
  }
});
