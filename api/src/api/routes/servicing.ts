import { ServicingService } from '@/services/servicing';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/servicing', route);
};

// GET /servicing?carNumber=X - Get servicing history, optionally filtered by car number
route.get('/', async (req: Request, res: Response) => {
  try {
    const service = Container.get(ServicingService);
    const carNumber = req.query.carNumber as string | undefined;

    const result = await service.getServicingHistory(carNumber);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch servicing history'
    });
  }
});

// GET /servicing/:id - Get single servicing record by ID
route.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = Container.get(ServicingService);
    const servicingId = Number(req.params.id);

    if (isNaN(servicingId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid servicing record ID'
      });
    }

    const result = await service.getServicingRecord(servicingId);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch servicing record'
    });
  }
});

// POST /servicing - Add a new servicing record
route.post('/', async (req: Request, res: Response) => {
  try {
    const service = Container.get(ServicingService);
    const data = req.body;

    if (!data.CarId || !data.DateServiced || !data.MileageServiced || !data.ServicingFrequency) {
      return res.status(400).send({
        success: false,
        message: 'CarId, DateServiced, MileageServiced, and ServicingFrequency are required'
      });
    }

    const result = await service.addServicingRecord(data);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to add servicing record'
    });
  }
});

// PUT /servicing/:id - Update an existing servicing record
route.put('/:id', async (req: Request, res: Response) => {
  try {
    const service = Container.get(ServicingService);
    const servicingId = Number(req.params.id);
    const data = req.body;

    if (isNaN(servicingId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid servicing record ID'
      });
    }

    if (!data.CarId || !data.DateServiced || !data.MileageServiced || !data.ServicingFrequency) {
      return res.status(400).send({
        success: false,
        message: 'CarId, DateServiced, MileageServiced, and ServicingFrequency are required'
      });
    }

    const result = await service.updateServicingRecord(servicingId, data);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to update servicing record'
    });
  }
});
