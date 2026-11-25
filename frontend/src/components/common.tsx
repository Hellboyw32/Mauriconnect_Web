import { Alert, AlertTitle, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function PageHeader({ overline, title, subtitle }: { overline?: string; title: string; subtitle?: ReactNode }) {
  return (
    <Box sx={{ background: 'linear-gradient(135deg, #0b4f8a 0%, #073864 100%)', color: '#fff', py: { xs: 5, md: 7 } }}>
      <Container>
        {overline && (
          <Typography variant="overline" sx={{ color: 'secondary.light' }}>
            {overline}
          </Typography>
        )}
        <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.6rem' } }}>
          {title}
        </Typography>
        {subtitle && <Typography sx={{ mt: 1.5, maxWidth: 720, color: 'rgba(255,255,255,.85)', fontSize: '1.05rem' }}>{subtitle}</Typography>}
      </Container>
    </Box>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 8 }} role="status" aria-live="polite">
      <CircularProgress />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, action }: { title?: string; message: string; onRetry?: () => void; action?: ReactNode }) {
  return (
    <Alert
      severity="error"
      sx={{ my: 3 }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Try again
          </Button>
        ) : (
          action
        )
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}

export function SectionTitle({ overline, title, subtitle, align = 'left' }: { overline?: string; title: string; subtitle?: string; align?: 'left' | 'center' }) {
  return (
    <Box sx={{ textAlign: align, mb: 4, maxWidth: align === 'center' ? 680 : undefined, mx: align === 'center' ? 'auto' : undefined }}>
      {overline && (
        <Typography variant="overline" color="secondary.dark">
          {overline}
        </Typography>
      )}
      <Typography variant="h2">{title}</Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: '1.05rem' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
