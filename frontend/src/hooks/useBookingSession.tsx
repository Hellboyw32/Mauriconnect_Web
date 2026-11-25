import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { bookingSessionReducer, loadSession, saveSession, type BookingSessionAction, type BookingSessionState } from './bookingSession';

interface BookingSessionContextValue {
  state: BookingSessionState;
  dispatch: (action: BookingSessionAction) => void;
}

const BookingSessionContext = createContext<BookingSessionContextValue | null>(null);

export function BookingSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingSessionReducer, undefined, () => loadSession());

  useEffect(() => {
    saveSession(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <BookingSessionContext.Provider value={value}>{children}</BookingSessionContext.Provider>;
}

export function useBookingSession() {
  const ctx = useContext(BookingSessionContext);
  if (!ctx) throw new Error('useBookingSession must be used inside BookingSessionProvider');
  return ctx;
}
