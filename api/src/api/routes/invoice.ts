import { InvoiceService } from '@/services/invoice';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/invoice', route);
};

// POST /invoice/generate-reference - Generate an invoice reference number for a customer
route.post('/generate-reference', async (req: Request, res: Response) => {
  try {
    const customerName = req.body.customerName as string | undefined;

    if (!customerName) {
      return res.status(400).send({
        success: false,
        message: 'customerName is required'
      });
    }

    const service = Container.get(InvoiceService);
    const result = await service.generateInvoiceReference(customerName);

    res.status(result.status).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to generate invoice reference'
    });
  }
});
