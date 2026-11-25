import { centsToDecimalString, decimalStringToCents } from '../utils/money';
import { logger } from '../utils/logger';
import {
  PaymentDeclinedError,
  PaymentProviderError,
  type CaptureResult,
  type CreateOrderInput,
  type PaymentProvider,
  type RefundResult,
  type WebhookEvent,
} from './types';

type FetchLike = typeof fetch;

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
  webhookId: string;
  brandName: string;
  fetchImpl?: FetchLike;
}

type PayPalCapture = { id: string; status: string; amount?: { value: string; currency_code: string }; custom_id?: string };
type PayPalOrder = {
  id: string;
  status: string;
  purchase_units?: { custom_id?: string; payments?: { captures?: PayPalCapture[] } }[];
};
type PayPalErrorBody = { name?: string; message?: string; details?: { issue?: string; description?: string }[] };

/** PayPal Orders v2 / Payments v2 over REST. */
export class PayPalProvider implements PaymentProvider {
  readonly name = 'PayPal' as const;
  private token: { value: string; expiresAt: number } | null = null;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly config: PayPalConfig) {
    this.baseUrl = config.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    const res = await this.fetchImpl(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new PaymentProviderError(`PayPal authentication failed (${res.status})`, res.status);
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return body.access_token;
  }

  private async call<T>(method: string, path: string, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<{ data: T; raw: string }> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await this.accessToken()}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const raw = await res.text();
    if (!res.ok) {
      let parsed: PayPalErrorBody = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        /* non-JSON error body */
      }
      const issue = parsed.details?.[0]?.issue ?? parsed.name;
      logger.warn({ status: res.status, issue, path }, 'PayPal API error');
      throw new PaymentProviderError(parsed.details?.[0]?.description ?? parsed.message ?? `PayPal error ${res.status}`, res.status, issue);
    }
    return { data: (raw ? JSON.parse(raw) : {}) as T, raw };
  }

  async createOrder(input: CreateOrderInput): Promise<{ orderId: string; raw: string }> {
    const { data, raw } = await this.call<PayPalOrder>(
      'POST',
      '/v2/checkout/orders',
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: input.reference,
            custom_id: input.reference,
            description: input.description.slice(0, 127),
            amount: { currency_code: input.currency, value: centsToDecimalString(input.amountCents) },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: this.config.brandName,
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW',
            },
          },
        },
      },
      { 'PayPal-Request-Id': input.requestId },
    );
    return { orderId: data.id, raw };
  }

  private static fromOrder(order: PayPalOrder, raw: string): CaptureResult {
    const unit = order.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const status = capture?.status === 'COMPLETED' ? 'COMPLETED' : capture?.status === 'PENDING' ? 'PENDING' : capture?.status === 'DECLINED' ? 'DECLINED' : 'FAILED';
    return {
      status,
      captureId: capture?.id ?? null,
      amountCents: capture?.amount ? decimalStringToCents(capture.amount.value) : null,
      currency: capture?.amount?.currency_code ?? null,
      customId: capture?.custom_id ?? unit?.custom_id ?? null,
      raw,
    };
  }

  async captureOrder(orderId: string, requestId: string): Promise<CaptureResult> {
    const safeId = encodeURIComponent(orderId);
    try {
      const { data, raw } = await this.call<PayPalOrder>('POST', `/v2/checkout/orders/${safeId}/capture`, {}, { 'PayPal-Request-Id': requestId });
      return PayPalProvider.fromOrder(data, raw);
    } catch (err) {
      if (err instanceof PaymentProviderError) {
        if (err.issue === 'INSTRUMENT_DECLINED' || err.issue === 'PAYER_ACTION_REQUIRED') throw new PaymentDeclinedError(err.message);
        if (err.issue === 'ORDER_ALREADY_CAPTURED') {
          const { data, raw } = await this.call<PayPalOrder>('GET', `/v2/checkout/orders/${safeId}`);
          return PayPalProvider.fromOrder(data, raw);
        }
      }
      throw err;
    }
  }

  async refundCapture(input: { captureId: string; amountCents: number; currency: string; requestId: string; note: string }): Promise<RefundResult> {
    const { data, raw } = await this.call<{ id: string; status: string }>(
      'POST',
      `/v2/payments/captures/${encodeURIComponent(input.captureId)}/refund`,
      { amount: { value: centsToDecimalString(input.amountCents), currency_code: input.currency }, note_to_payer: input.note.slice(0, 255) },
      { 'PayPal-Request-Id': input.requestId },
    );
    const status = (['COMPLETED', 'PENDING', 'FAILED', 'CANCELLED'] as const).find((s) => s === data.status) ?? 'PENDING';
    return { refundId: data.id, status, raw };
  }

  async verifyWebhook(headers: Record<string, string | string[] | undefined>, rawBody: string): Promise<boolean> {
    if (!this.config.webhookId) {
      logger.error('PAYPAL_WEBHOOK_ID is not set: webhook rejected');
      return false;
    }
    const h = (name: string) => {
      const v = headers[name];
      return Array.isArray(v) ? v[0] : v;
    };
    try {
      const { data } = await this.call<{ verification_status: string }>('POST', '/v1/notifications/verify-webhook-signature', {
        auth_algo: h('paypal-auth-algo'),
        cert_url: h('paypal-cert-url'),
        transmission_id: h('paypal-transmission-id'),
        transmission_sig: h('paypal-transmission-sig'),
        transmission_time: h('paypal-transmission-time'),
        webhook_id: this.config.webhookId,
        webhook_event: JSON.parse(rawBody),
      });
      return data.verification_status === 'SUCCESS';
    } catch (err) {
      logger.warn({ err }, 'PayPal webhook verification failed');
      return false;
    }
  }

  parseWebhook(rawBody: string): WebhookEvent {
    const event = JSON.parse(rawBody) as {
      id: string;
      event_type: string;
      resource?: PayPalCapture & { supplementary_data?: { related_ids?: { order_id?: string } } };
    };
    const r = event.resource;
    return {
      id: event.id,
      eventType: event.event_type,
      orderId: r?.supplementary_data?.related_ids?.order_id ?? null,
      captureId: r?.id ?? null,
      amountCents: r?.amount ? decimalStringToCents(r.amount.value) : null,
      currency: r?.amount?.currency_code ?? null,
      customId: r?.custom_id ?? null,
    };
  }
}
