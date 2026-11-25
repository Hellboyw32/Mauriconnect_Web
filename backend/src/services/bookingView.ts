import type { BookingRecord } from '../repositories/bookingRepository';
import { toLocalIso } from '../utils/time';

/** Public representation of a booking. Internal ids (booking, car, customer, payment) are never exposed. */
export function toBookingView(b: BookingRecord, now: Date) {
  const pickupInFuture = b.pickupUtc.getTime() > now.getTime();
  const paid = b.payment && ['Successful', 'Refunded', 'PartiallyRefunded'].includes(b.payment.status);
  return {
    reference: b.reference,
    status: b.status,
    paymentStatus: b.paymentStatus,
    createdAt: toLocalIso(b.createdAtUtc),
    confirmedAt: b.confirmedAtUtc ? toLocalIso(b.confirmedAtUtc) : null,
    holdExpiresAt: b.status === 'PendingPayment' && b.holdExpiresAtUtc ? b.holdExpiresAtUtc.toISOString() : null,
    car: {
      slug: b.model.slug,
      name: b.model.name,
      category: b.model.category,
      transmission: b.model.transmission,
      fuelType: b.model.fuelType,
      passengers: b.model.passengers,
      doors: b.model.doors,
      luggage: b.model.luggage,
      airConditioning: b.model.airConditioning,
      imageUrl: b.model.imageUrl,
    },
    pickup: { location: b.pickupLocation, at: toLocalIso(b.pickupUtc), address: b.pickupAddress },
    return: { location: b.returnLocation, at: toLocalIso(b.returnUtc), address: b.returnAddress },
    rentalDays: b.rentalDays,
    charges: b.charges,
    subTotal: b.subTotal,
    additionalCharges: b.additionalCharges,
    total: b.total,
    currency: b.currency,
    securityDeposit: b.securityDeposit,
    customer: b.customer,
    travel: {
      flightNumber: b.flightNumber,
      arrivalAt: b.arrivalUtc ? toLocalIso(b.arrivalUtc) : null,
      accommodation: b.accommodation,
      specialRequests: b.specialRequests,
    },
    payment: b.payment
      ? {
          provider: b.payment.provider,
          status: b.payment.status,
          transactionId: paid ? b.payment.captureId : null,
          amount: b.payment.amount,
          currency: b.payment.currency,
          paidAt: b.payment.paymentDateUtc ? toLocalIso(b.payment.paymentDateUtc) : null,
          refundAmount: b.payment.refundAmount,
          refundReference: b.payment.refundReference,
        }
      : null,
    cancellation: b.cancellation
      ? {
          cancelledAt: toLocalIso(b.cancellation.cancelledAtUtc),
          reason: b.cancellation.reason,
          fee: b.cancellation.fee,
          feePercent: b.cancellation.feePercent,
          refundAmount: b.cancellation.refundAmount,
          refundStatus: b.cancellation.status,
          refundReference: b.cancellation.refundReference,
        }
      : null,
    canPay: (b.status === 'PendingPayment' || b.status === 'Expired') && pickupInFuture,
    canCancel: (b.status === 'Confirmed' || b.status === 'PendingPayment') && pickupInFuture,
    documents: {
      voucher: ['Confirmed', 'InProgress', 'Completed'].includes(b.status),
      cancellation: b.status === 'Cancelled',
    },
  };
}

export type BookingView = ReturnType<typeof toBookingView>;
