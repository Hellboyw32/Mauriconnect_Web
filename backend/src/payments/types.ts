/** Provider-neutral payment interface: new gateways implement this without touching the services. */
export interface CreateOrderInput {
  reference: string;
  amountCents: number;
  currency: string;
  description: string;
  requestId: string;
}

export interface CaptureResult {
  /** Capture status: only COMPLETED means the money was taken. */
  status: 'COMPLETED' | 'PENDING' | 'DECLINED' | 'FAILED';
  captureId: string | null;
  amountCents: number | null;
  currency: string | null;
  customId: string | null;
  raw: string;
}

export interface RefundResult {
  refundId: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  raw: string;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  orderId: string | null;
  captureId: string | null;
  amountCents: number | null;
  currency: string | null;
  customId: string | null;
}

export interface PaymentProvider {
  readonly name: 'PayPal' | 'Fake';
  createOrder(input: CreateOrderInput): Promise<{ orderId: string; raw: string }>;
  captureOrder(orderId: string, requestId: string): Promise<CaptureResult>;
  refundCapture(input: { captureId: string; amountCents: number; currency: string; requestId: string; note: string }): Promise<RefundResult>;
  verifyWebhook(headers: Record<string, string | string[] | undefined>, rawBody: string): Promise<boolean>;
  parseWebhook(rawBody: string): WebhookEvent;
}

/** The payer's funding source was declined: the customer can retry with another card or account. */
export class PaymentDeclinedError extends Error {
  constructor(message = 'The payment was declined.') {
    super(message);
    this.name = 'PaymentDeclinedError';
  }
}

export class PaymentProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly issue?: string,
  ) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}
