import * as https from 'https';
import { URL } from 'url';
import { Service } from 'typedi';
import type { Response } from '@/types';
import type { InvoiceReference } from '@libs/types';

export interface IInvoiceService {
  generateInvoiceReference(customerName: string): Promise<Response<InvoiceReference>>;
}

interface HttpJsonResult {
  status: number;
  body: string;
}

const postJson = (
  url: string,
  payload: string,
  username: string,
  password: string
): Promise<HttpJsonResult> => {
  return new Promise((resolve, reject) => {
    const { hostname, pathname, search } = new URL(url);

    const req = https.request(
      {
        hostname,
        path: `${pathname}${search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          username,
          password
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode || 500, body });
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

@Service()
export class InvoiceService implements IInvoiceService {
  async generateInvoiceReference(customerName: string): Promise<Response<InvoiceReference>> {
    const url =
      process.env.INVOICE_API_URL || 'https://api.mauriconnect.com/api/GenerateInvoiceReference';
    const username = process.env.INVOICE_API_USERNAME || '';
    const password = process.env.INVOICE_API_PASSWORD || '';
    const payload = JSON.stringify({ customername: customerName });

    try {
      const { status, body } = await postJson(url, payload, username, password);

      if (status < 200 || status >= 300) {
        return {
          status,
          message: `Invoice reference API returned an error: ${body}`,
          success: false
        };
      }

      const data = JSON.parse(body) as InvoiceReference;

      return {
        status: 200,
        message: 'Invoice reference generated successfully.',
        data,
        success: true
      };
    } catch (error) {
      return {
        status: 500,
        message: `Failed to generate invoice reference: ${error}`,
        error,
        success: false
      };
    }
  }
}
