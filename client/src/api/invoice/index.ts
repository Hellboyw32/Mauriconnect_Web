import type { InvoiceReference } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

type GenerateInvoiceReferenceRequest = {
  customerName: string;
};

class InvoiceApi {
  async generateInvoiceReference(
    request: GenerateInvoiceReferenceRequest
  ): Promise<InvoiceReference> {
    const response = await api.post<InvoiceReference>(
      `${API_ENDPOINTS.INVOICE}/generate-reference`,
      { customerName: request.customerName }
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to generate invoice reference');
    }

    return response.data;
  }
}

export const invoiceApi = new InvoiceApi();
