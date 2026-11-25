import { Step, StepButton, StepLabel, Stepper, useMediaQuery, useTheme } from '@mui/material';

export const BOOKING_STEPS = ['Select your car', 'Customer details', 'Payment'] as const;

/** Progress indicator for the three booking steps. Completed steps can be revisited. */
export function BookingStepper({ active, onStepClick }: { active: 0 | 1 | 2; onStepClick?: (step: number) => void }) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Stepper activeStep={active} alternativeLabel={compact} aria-label="Booking progress" sx={{ py: { xs: 2, md: 3 } }}>
      {BOOKING_STEPS.map((label, i) => (
        <Step key={label} completed={i < active}>
          {onStepClick && i < active ? (
            <StepButton onClick={() => onStepClick(i)} optional={null}>
              {compact ? label.split(' ').pop() : `Step ${i + 1} – ${label}`}
            </StepButton>
          ) : (
            <StepLabel>{compact ? label.split(' ').pop() : `Step ${i + 1} – ${label}`}</StepLabel>
          )}
        </Step>
      ))}
    </Stepper>
  );
}
