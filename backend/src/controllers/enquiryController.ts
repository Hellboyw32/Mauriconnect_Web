import type { EnquiryService } from '../services/enquiryService';
import { asyncHandler, clientIp } from './asyncHandler';

export function createEnquiryController(enquiries: EnquiryService) {
  return {
    submit: asyncHandler(async (req, res) => {
      await enquiries.submit(req.body, clientIp(req));
      res.status(202).json({ received: true });
    }),
  };
}
