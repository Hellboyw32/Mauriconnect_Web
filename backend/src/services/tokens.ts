import jwt from 'jsonwebtoken';
import type { AppConfig } from './deps';

type TokenKind = 'booking' | 'link';
interface TokenPayload {
  sub: string;
  typ: TokenKind;
}

const AUDIENCE = 'mauriconnect-booking';

/**
 * Booking-scoped JWTs. A token grants access to exactly one booking reference:
 *  - booking: issued after creating a booking or verifying the email (short lived)
 *  - link:    embedded in confirmation emails as the secure "manage booking" link (long lived)
 */
export function createTokenService(config: Pick<AppConfig, 'jwtSecret' | 'bookingTokenTtlMinutes' | 'linkTokenTtlDays'>) {
  const sign = (reference: string, typ: TokenKind, expiresIn: number) =>
    jwt.sign({ typ } satisfies Omit<TokenPayload, 'sub'>, config.jwtSecret, { subject: reference, audience: AUDIENCE, expiresIn, algorithm: 'HS256' });

  return {
    issueBookingToken: (reference: string) => sign(reference, 'booking', config.bookingTokenTtlMinutes * 60),
    issueLinkToken: (reference: string) => sign(reference, 'link', config.linkTokenTtlDays * 86_400),

    /** Returns the booking reference the token grants access to, or null if invalid/expired. */
    verify(token: string): string | null {
      try {
        const payload = jwt.verify(token, config.jwtSecret, { audience: AUDIENCE, algorithms: ['HS256'] }) as TokenPayload;
        return payload.typ === 'booking' || payload.typ === 'link' ? payload.sub : null;
      } catch {
        return null;
      }
    },
  };
}

export type TokenService = ReturnType<typeof createTokenService>;
