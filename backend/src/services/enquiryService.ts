import type { z } from 'zod';
import type { enquirySchema } from '../validation/schemas';
import type { Deps } from './deps';

export function createEnquiryService(deps: Deps) {
  return {
    /** Quote requests (e.g. 1-2 day rentals) and contact messages are stored and forwarded to the office. */
    async submit(input: z.infer<typeof enquirySchema>, ipAddress: string | null) {
      await deps.enquiries.insert({ ...input, ipAddress });
      if (deps.config.officeEmail) await deps.outbox.enqueue('OfficeEnquiry', deps.config.officeEmail, null, { ...input });
    },
  };
}

export type EnquiryService = ReturnType<typeof createEnquiryService>;
