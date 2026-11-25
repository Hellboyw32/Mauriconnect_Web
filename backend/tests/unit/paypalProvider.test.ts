import { describe, expect, it } from 'vitest';
import { PayPalProvider } from '../../src/payments/paypalProvider';
import { PaymentDeclinedError, PaymentProviderError } from '../../src/payments/types';

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };

/** Scripted PayPal REST API: answers each request with the next queued response. */
function fakePayPal(responses: { status?: number; body: unknown }[]) {
  const calls: Call[] = [];
  const queue = [...responses];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const body = typeof init.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) : init.body;
    calls.push({ url, method: init.method ?? 'GET', headers: init.headers as Record<string, string>, body });
    if (url.endsWith('/v1/oauth2/token')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 });
    const next = queue.shift();
    if (!next) throw new Error(`Unexpected request ${url}`);
    return new Response(JSON.stringify(next.body), { status: next.status ?? 200 });
  }) as unknown as typeof fetch;
  const provider = new PayPalProvider({ clientId: 'id', clientSecret: 'secret', mode: 'sandbox', webhookId: 'WH-1', brandName: 'MauriConnect', fetchImpl });
  return { provider, calls, apiCalls: () => calls.filter((c) => !c.url.endsWith('/oauth2/token')) };
}

const capturedOrder = (status = 'COMPLETED', value = '228.00') => ({
  id: 'ORDER-1',
  status: 'COMPLETED',
  purchase_units: [{ custom_id: 'MC-270310-ABCD', payments: { captures: [{ id: 'CAP-1', status, amount: { value, currency_code: 'EUR' }, custom_id: 'MC-270310-ABCD' }] } }],
});

describe('PayPalProvider', () => {
  it('creates an order for the exact amount with the booking reference and an idempotency key', async () => {
    const { provider, calls, apiCalls } = fakePayPal([{ status: 201, body: { id: 'ORDER-1', status: 'CREATED' } }]);
    const order = await provider.createOrder({ reference: 'MC-270310-ABCD', amountCents: 22850, currency: 'EUR', description: 'Car rental', requestId: 'order-1' });
    expect(order.orderId).toBe('ORDER-1');
    expect(calls[0].url).toBe('https://api-m.sandbox.paypal.com/v1/oauth2/token');
    const [create] = apiCalls();
    expect(create.url).toBe('https://api-m.sandbox.paypal.com/v2/checkout/orders');
    expect(create.headers).toMatchObject({ Authorization: 'Bearer tok', 'PayPal-Request-Id': 'order-1' });
    expect(create.body).toMatchObject({
      intent: 'CAPTURE',
      purchase_units: [{ custom_id: 'MC-270310-ABCD', amount: { currency_code: 'EUR', value: '228.50' } }],
    });
  });

  it('reuses the access token between calls', async () => {
    const { provider, calls } = fakePayPal([{ body: { id: 'A' } }, { body: { id: 'B' } }]);
    await provider.createOrder({ reference: 'MC-270310-ABCD', amountCents: 100, currency: 'EUR', description: 'x', requestId: 'a' });
    await provider.createOrder({ reference: 'MC-270310-ABCD', amountCents: 100, currency: 'EUR', description: 'x', requestId: 'b' });
    expect(calls.filter((c) => c.url.endsWith('/oauth2/token'))).toHaveLength(1);
  });

  it('reads the captured amount, currency and reference from the capture', async () => {
    const { provider, apiCalls } = fakePayPal([{ status: 201, body: capturedOrder() }]);
    const capture = await provider.captureOrder('ORDER-1', 'capture-ORDER-1');
    expect(capture).toMatchObject({ status: 'COMPLETED', captureId: 'CAP-1', amountCents: 22800, currency: 'EUR', customId: 'MC-270310-ABCD' });
    expect(apiCalls()[0]).toMatchObject({ url: expect.stringContaining('/v2/checkout/orders/ORDER-1/capture'), headers: expect.objectContaining({ 'PayPal-Request-Id': 'capture-ORDER-1' }) });
  });

  it('reports pending and declined captures as not completed', async () => {
    const { provider } = fakePayPal([{ body: capturedOrder('PENDING') }, { body: capturedOrder('DECLINED') }]);
    expect((await provider.captureOrder('ORDER-1', 'r1')).status).toBe('PENDING');
    expect((await provider.captureOrder('ORDER-1', 'r2')).status).toBe('DECLINED');
  });

  it('turns a declined card into a retryable decline', async () => {
    const { provider } = fakePayPal([{ status: 422, body: { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'INSTRUMENT_DECLINED', description: 'The instrument was declined.' }] } }]);
    await expect(provider.captureOrder('ORDER-1', 'r')).rejects.toBeInstanceOf(PaymentDeclinedError);
  });

  it('recovers the existing capture when the order was already captured', async () => {
    const { provider, apiCalls } = fakePayPal([
      { status: 422, body: { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'ORDER_ALREADY_CAPTURED' }] } },
      { body: capturedOrder() },
    ]);
    expect(await provider.captureOrder('ORDER-1', 'r')).toMatchObject({ status: 'COMPLETED', captureId: 'CAP-1' });
    expect(apiCalls()[1]).toMatchObject({ method: 'GET', url: expect.stringContaining('/v2/checkout/orders/ORDER-1') });
  });

  it('raises a provider error for other failures', async () => {
    const { provider } = fakePayPal([{ status: 500, body: { name: 'INTERNAL_SERVER_ERROR', message: 'boom' } }]);
    await expect(provider.captureOrder('ORDER-1', 'r')).rejects.toBeInstanceOf(PaymentProviderError);
  });

  it('refunds a capture with an idempotency key', async () => {
    const { provider, apiCalls } = fakePayPal([{ status: 201, body: { id: 'REF-1', status: 'COMPLETED' } }]);
    const refund = await provider.refundCapture({ captureId: 'CAP-1', amountCents: 9000, currency: 'EUR', requestId: 'refund-MC', note: 'Refund' });
    expect(refund).toMatchObject({ refundId: 'REF-1', status: 'COMPLETED' });
    expect(apiCalls()[0]).toMatchObject({
      url: expect.stringContaining('/v2/payments/captures/CAP-1/refund'),
      headers: expect.objectContaining({ 'PayPal-Request-Id': 'refund-MC' }),
      body: expect.objectContaining({ amount: { value: '90.00', currency_code: 'EUR' } }),
    });
  });

  it('verifies webhook signatures with PayPal and rejects failures', async () => {
    const event = JSON.stringify({ id: 'WH-EVT', event_type: 'PAYMENT.CAPTURE.COMPLETED' });
    const ok = fakePayPal([{ body: { verification_status: 'SUCCESS' } }]);
    expect(await ok.provider.verifyWebhook({ 'paypal-transmission-id': 't1' }, event)).toBe(true);
    expect(ok.apiCalls()[0].body).toMatchObject({ webhook_id: 'WH-1', transmission_id: 't1', webhook_event: { id: 'WH-EVT' } });
    const bad = fakePayPal([{ body: { verification_status: 'FAILURE' } }]);
    expect(await bad.provider.verifyWebhook({}, event)).toBe(false);
  });

  it('parses a capture-completed webhook', () => {
    const { provider } = fakePayPal([]);
    const event = provider.parseWebhook(
      JSON.stringify({
        id: 'WH-EVT',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: { id: 'CAP-1', amount: { value: '228.00', currency_code: 'EUR' }, custom_id: 'MC-270310-ABCD', supplementary_data: { related_ids: { order_id: 'ORDER-1' } } },
      }),
    );
    expect(event).toEqual({ id: 'WH-EVT', eventType: 'PAYMENT.CAPTURE.COMPLETED', orderId: 'ORDER-1', captureId: 'CAP-1', amountCents: 22800, currency: 'EUR', customId: 'MC-270310-ABCD' });
  });
});
