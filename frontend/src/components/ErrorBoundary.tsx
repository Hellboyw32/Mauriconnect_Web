import { Alert, AlertTitle, Button, Container, Stack } from '@mui/material';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { company } from '../content/company';

/** Shows a friendly message instead of a blank page if a page crashes while rendering. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crashed', error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Navigating to another page clears the error.
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          <AlertTitle>Something went wrong on this page</AlertTitle>
          Your booking details are saved. Please reload the page, or contact us on {company.phone} if the problem continues.
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" size="small" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button size="small" href="/">
              Home
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }
}
