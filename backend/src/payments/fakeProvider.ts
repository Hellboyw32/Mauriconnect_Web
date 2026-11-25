import { randomUUID } from 'node:crypto';
import {
  PaymentDeclinedError,
  type CaptureResult,
  type CreateOrderInput,
  type PaymentProvider,
  type RefundResult,
  type WebhookEvent,
} from './types';

type Behaviour = 'complete' | 'decline' | 'pending' | 'fail' | 'wrongAmount';

/**
 * In-memory payment simulator for automated tests and offline development.
 * Never enabled in production (enforced in config/env.ts).
 */
export class FakePaymentProvider implements PaymentProvider {
  readonly name = 'Fake' as const;
  readonly orders = new Map<string, { reference: string; amountCents: number; currency: string; captureId?: string }>();
  readonly refunds: { captureId: string; amountCents: number; requestId: string }[] = [];
  readonly captureCalls: string[] = [];
  private nextCapture: Behaviour[] = [];
  private refundFails = false;

  /** Queue the outcome of the next capture calls (tests). */
  queueCapture(...behaviours: Behaviour[]) {
    this.nextCapture.push(...behaviours);
  }

  failRefunds(fail: boolean) {
    this.refundFails = fail;
  }

  async createOrder(input: CreateOrderInput): Promise<{ orderId: string; raw: string }> {
    const orderId = `FAKE-${randomUUID().slice(0, 13).toUpperCase()}`;
    this.orders.set(orderId, { reference: input.reference, amountCents: input.amountCents, currency: input.currency });
    return { orderId, raw: JSON.stringify({ id: orderId, status: 'CREATED' }) };
  }

  async captureOrder(orderId: string): Promise<CaptureResult> {
    this.captureCalls.push(orderId);
    const order = this.orders.get(orderId);
    if (!order) return { status: 'FAILED', captureId: null, amountCents: null, currency: null, customId: null, raw: '{}' };
    // Capturing twice returns the original capture, like PayPal's idempotent API.
    if (order.captureId) {
      return { status: 'COMPLETED', captureId: order.captureId, amountCents: order.amountCents, currency: order.currency, customId: order.reference, raw: '{}' };
    }
    const behaviour = this.nextCapture.shift() ?? 'complete';
    if (behaviour === 'decline') throw new PaymentDeclinedError('Card declined (simulated).');
    if (behaviour === 'fail') return { status: 'FAILED', captureId: null, amountCents: null, currency: null, customId: order.reference, raw: '{}' };
    const captureId = `FAKECAP-${randomUUID().slice(0, 12).toUpperCase()}`;
    if (behaviour !== 'pending') order.captureId = captureId;
    return {
      status: behaviour === 'pending' ? 'PENDING' : 'COMPLETED',
      captureId,
      amountCents: behaviour === 'wrongAmount' ? order.amountCents - 100 : order.amountCents,
      currency: order.currency,
      customId: order.reference,
      raw: JSON.stringify({ id: orderId, status: 'COMPLETED', captureId }),
    };
  }

  async refundCapture(input: { captureId: string; amountCents: number; currency: string; requestId: string }): Promise<RefundResult> {
    if (this.refundFails) throw new Error('Refund failed (simulated).');
    // Same request id = same refund, like PayPal-Request-Id.
    if (!this.refunds.some((r) => r.requestId === input.requestId)) {
      this.refunds.push({ captureId: input.captureId, amountCents: input.amountCents, requestId: input.requestId });
    }
    return { refundId: `FAKEREF-${input.requestId}`.slice(0, 64), status: 'COMPLETED', raw: '{}' };
  }

  async verifyWebhook(headers: Record<string, string | string[] | undefined>): Promise<boolean> {
    return headers['x-fake-signature'] === 'valid';
  }

  parseWebhook(rawBody: string): WebhookEvent {
    return JSON.parse(rawBody) as WebhookEvent;
  }
}
