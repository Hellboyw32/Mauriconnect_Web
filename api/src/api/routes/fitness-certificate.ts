import { FitnessCertificateService } from '@/services/fitness-certificate';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/fitness-certificate', route);
};

// GET /fitness-certificate?carNumber=X - Get all fitness certificate records with optional filter
route.get('/', async (req: Request, res: Response) => {
  try {
    const service = Container.get(FitnessCertificateService);
    const carNumber = req.query.carNumber as string | undefined;

    const result = await service.getFitnessCertificates(carNumber);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch fitness certificate records'
    });
  }
});

// GET /fitness-certificate/:id - Get single fitness certificate record by ID
route.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = Container.get(FitnessCertificateService);
    const fitnessId = Number(req.params.id);

    if (isNaN(fitnessId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid fitness certificate ID'
      });
    }

    const result = await service.getFitnessCertificate(fitnessId);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to fetch fitness certificate record'
    });
  }
});

// POST /fitness-certificate - Create new fitness certificate record
route.post('/', async (req: Request, res: Response) => {
  try {
    const service = Container.get(FitnessCertificateService);
    const data = req.body;

    if (!data.CarId || !data.StartDate || !data.EndDate) {
      return res.status(400).send({
        success: false,
        message: 'CarId, StartDate, and EndDate are required'
      });
    }

    const result = await service.createFitnessCertificate(data);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to create fitness certificate record'
    });
  }
});

// PUT /fitness-certificate/:id - Update existing fitness certificate record
route.put('/:id', async (req: Request, res: Response) => {
  try {
    const service = Container.get(FitnessCertificateService);
    const fitnessId = Number(req.params.id);
    const data = req.body;

    if (isNaN(fitnessId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid fitness certificate ID'
      });
    }

    const result = await service.updateFitnessCertificate(fitnessId, data);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to update fitness certificate record'
    });
  }
});

// DELETE /fitness-certificate/:id - Soft delete fitness certificate record (set IsActive=false)
route.delete('/:id', async (req: Request, res: Response) => {
  try {
    const service = Container.get(FitnessCertificateService);
    const fitnessId = Number(req.params.id);
    const createdBy = req.body.createdBy || (req.query.createdBy as string) || 'system';

    if (isNaN(fitnessId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid fitness certificate ID'
      });
    }

    const result = await service.deleteFitnessCertificate(fitnessId, createdBy);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to delete fitness certificate record'
    });
  }
});
