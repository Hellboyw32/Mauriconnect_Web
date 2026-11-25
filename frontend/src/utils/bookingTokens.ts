/*
  Access tokens for bookings this browser has created or looked up, keyed by reference.
  They are short lived (issued by the API) and kept for the tab only.
*/
const KEY = 'mauriconnect.tokens.v1';

function read(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

export const bookingTokens = {
  get: (reference: string): string | null => read()[reference.toUpperCase()] ?? null,
  set(reference: string, token: string) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ ...read(), [reference.toUpperCase()]: token }));
    } catch {
      // Storage unavailable: the customer will be asked to look the booking up again.
    }
  },
  remove(reference: string) {
    const all = read();
    delete all[reference.toUpperCase()];
    try {
      sessionStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  },
};
