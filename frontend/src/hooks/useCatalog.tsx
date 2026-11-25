import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { catalogService } from '../services/catalogService';
import type { AppConfig, Extra, Location } from '../types/api';

/** Reference data used across the site, loaded once: settings, locations and extras. */
interface CatalogState {
  config: AppConfig | null;
  locations: Location[];
  extras: Extra[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<CatalogState, 'reload'>>({ config: null, locations: [], extras: [], loading: true, error: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([catalogService.config(), catalogService.locations(), catalogService.extras()])
      .then(([config, locations, extras]) => setState({ config, locations, extras, loading: false, error: null }))
      .catch(() => setState((s) => ({ ...s, loading: false, error: 'Online booking is temporarily unavailable. Please call or WhatsApp us.' })));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <CatalogContext.Provider value={{ ...state, reload: load }}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
