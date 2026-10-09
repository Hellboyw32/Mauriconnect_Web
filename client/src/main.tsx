import { createRoot } from 'react-dom/client';
import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { App } from 'src/app';
import { ErrorBoundary } from 'src/components/error-boundary';
import { registerGlobalErrorHandlers } from 'src/utils/log-client-error';

registerGlobalErrorHandlers();

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <ErrorBoundary>
    <HelmetProvider>
      <BrowserRouter>
        <Suspense>
          <App />
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  </ErrorBoundary>
);
