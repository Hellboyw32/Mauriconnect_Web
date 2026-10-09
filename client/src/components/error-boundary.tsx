import { Component, type ErrorInfo, type ReactNode } from 'react';

import { logClientError } from 'src/utils/log-client-error';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Catches render errors anywhere below it, records them in AppLogError and
// shows a fallback instead of a blank screen.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logClientError({
      errorCategory: 'ClientError',
      severity: 'Fatal',
      errorMessage: error.message,
      stackTrace: `${error.stack ?? ''}\n${info.componentStack ?? ''}`,
      componentName: 'ErrorBoundary'
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>The error has been recorded. Please reload the page and try again.</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}
