import { zodResolver } from '@hookform/resolvers/zod';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Alert, Box, Button, Grid2 as Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { CountryCode } from 'libphonenumber-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch, type Path } from 'react-hook-form';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import { BookingSummary } from '../components/BookingSummary';
import { CountrySelect, DialCodeSelect } from '../components/CountrySelect';
import { ErrorState } from '../components/common';
import { ExtrasSelector } from '../components/ExtrasSelector';
import { fingerprint } from '../hooks/bookingSession';
import { useBookingSession } from '../hooks/useBookingSession';
import { useCatalog } from '../hooks/useCatalog';
import { BookingLayout } from '../layouts/BookingLayout';
import { ApiError, errorMessage } from '../services/apiClient';
import { bookingService } from '../services/bookingService';
import { catalogService } from '../services/catalogService';
import type { QuoteResult } from '../types/api';
import { buildBookingRequest } from '../utils/bookingRequest';
import { bookingTokens } from '../utils/bookingTokens';
import { joinPhone } from '../utils/countries';
import { fromIsoDate, toIsoDate } from '../utils/datetime';
import { searchToQuery } from '../utils/searchParams';
import { customerFormRefined, serverFieldName, type CustomerFormValues } from '../utils/validation';

const EMPTY: CustomerFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phoneCountry: '',
  phoneNational: '',
  country: '',
  nationality: '',
  address: '',
  city: '',
  postalCode: '',
  drivingLicenceNumber: '',
  flightNumber: '',
  arrivalDate: '',
  arrivalTime: '',
  accommodation: '',
  pickupAddress: '',
  returnAddress: '',
  specialRequests: '',
};

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 } }} component="section">
      <Typography variant="h4" component="h2">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
      <Box sx={{ mt: 2.5 }}>{children}</Box>
    </Paper>
  );
}

/** Step 2: extras, driver and travel details. Creates the (unpaid) booking on submit. */
export function CustomerDetailsPage() {
  const { state, dispatch } = useBookingSession();
  const { extras: allExtras } = useCatalog();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { search, carSlug, extras } = state;

  useEffect(() => {
    if (!search || !carSlug) return;
    let active = true;
    setQuoteLoading(true);
    catalogService
      .quote(search, carSlug, extras)
      .then((q) => active && (setQuote(q), setQuoteError(null)))
      .catch((err) => active && setQuoteError(errorMessage(err)))
      .finally(() => active && setQuoteLoading(false));
    return () => {
      active = false;
    };
  }, [search, carSlug, extras]);

  const needs = { pickupAddress: !!quote?.search.pickupLocation.requiresAddress, returnAddress: !!quote?.search.returnLocation.requiresAddress };
  const schema = useMemo(
    () => customerFormRefined({ pickupNeedsAddress: needs.pickupAddress, returnNeedsAddress: needs.returnAddress, joinPhone: (c, n) => joinPhone(c as CountryCode, n) }),
    [needs.pickupAddress, needs.returnAddress],
  );

  const form = useForm<CustomerFormValues>({ resolver: zodResolver(schema), defaultValues: { ...EMPTY, ...state.form }, mode: 'onTouched' });
  const { control, handleSubmit, setError, setValue, getValues, formState } = form;

  // Keep what the customer types in the session, so going back to step 1 never loses it.
  const values = useWatch({ control });
  const saveTimer = useRef<number>(undefined);
  useEffect(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => dispatch({ type: 'form', values }), 250);
    return () => window.clearTimeout(saveTimer.current);
  }, [values, dispatch]);

  // Suggest the dialling code from the country of residence.
  const country = useWatch({ control, name: 'country' });
  useEffect(() => {
    if (country && !getValues('phoneCountry')) setValue('phoneCountry', country);
  }, [country, getValues, setValue]);

  if (!search) return <Navigate to="/" replace />;
  if (!carSlug) return <Navigate to={`/booking/cars?${searchToQuery(search)}`} replace />;

  const backToCars = () => {
    dispatch({ type: 'form', values: getValues() });
    navigate(`/booking/cars?${searchToQuery(search)}`);
  };

  const onSubmit = async (v: CustomerFormValues) => {
    setSubmitError(null);
    dispatch({ type: 'form', values: v });
    const request = buildBookingRequest(search, carSlug, extras, v, needs);
    const fp = fingerprint(request);

    try {
      // Same details as the booking already created: reuse it.
      if (state.booking?.fingerprint === fp) {
        navigate('/booking/payment');
        return;
      }
      // Something changed: release the old unpaid booking's car before creating a new one.
      if (state.booking) {
        await bookingService.abandon(state.booking.reference, state.booking.token).catch(() => undefined);
        dispatch({ type: 'bookingReleased' });
      }
      const key = state.pendingKey?.fingerprint === fp ? state.pendingKey.key : crypto.randomUUID();
      dispatch({ type: 'pendingKey', fingerprint: fp, key });
      const created = await bookingService.create(request, key);
      bookingTokens.set(created.booking.reference, created.accessToken);
      dispatch({ type: 'bookingCreated', booking: { reference: created.booking.reference, token: created.accessToken, fingerprint: fp } });
      navigate('/booking/payment');
    } catch (err) {
      if (err instanceof ApiError && err.details.length) {
        let mapped = 0;
        for (const d of err.details) {
          const name = serverFieldName(d.path);
          if (name) {
            setError(name, { type: 'server', message: d.message }, { shouldFocus: mapped === 0 });
            mapped++;
          }
        }
        if (mapped === err.details.length) {
          setSubmitError('Please check the highlighted fields.');
          return;
        }
      }
      setSubmitError(errorMessage(err));
    }
  };

  const text = (name: Path<CustomerFormValues>, label: string, props: Partial<React.ComponentProps<typeof TextField>> = {}) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField {...field} value={field.value ?? ''} label={label} error={!!fieldState.error} helperText={fieldState.error?.message ?? props.helperText} {...props} />
      )}
    />
  );

  const summary = (
    <BookingSummary
      loading={quoteLoading}
      onChangeCar={backToCars}
      data={
        quote && {
          car: quote.car,
          pickup: { location: quote.search.pickupLocation, at: quote.search.pickupAt },
          return: { location: quote.search.returnLocation, at: quote.search.returnAt },
          rentalDays: quote.price.rentalDays,
          charges: quote.price.charges,
          subTotal: quote.price.subTotal,
          additionalCharges: quote.price.additionalCharges,
          total: quote.price.total,
        }
      }
    />
  );

  return (
    <BookingLayout step={1} summary={summary}>
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          {quoteError && (
            <ErrorState
              title="This car cannot be booked"
              message={quoteError}
              action={
                <Button color="inherit" size="small" onClick={backToCars}>
                  Choose another car
                </Button>
              }
            />
          )}

          {allExtras.length > 0 && (
            <Section title="Extras" subtitle="Optional. Add anything you need for your trip.">
              <ExtrasSelector extras={allExtras} value={extras} onChange={(v) => dispatch({ type: 'extras', extras: v })} />
            </Section>
          )}

          <Section title="Main driver" subtitle="The main driver must be at least 18 and have held a licence for at least 1 year.">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>{text('firstName', 'First name', { required: true, autoComplete: 'given-name' })}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{text('lastName', 'Last name', { required: true, autoComplete: 'family-name' })}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {text('email', 'Email address', { required: true, type: 'email', autoComplete: 'email', helperText: 'Your voucher is sent to this address.' })}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Box sx={{ width: 130, flexShrink: 0 }}>
                    <Controller
                      name="phoneCountry"
                      control={control}
                      render={({ field, fieldState }) => <DialCodeSelect value={field.value} onChange={field.onChange} error={!!fieldState.error} />}
                    />
                  </Box>
                  {text('phoneNational', 'Mobile number', { required: true, type: 'tel', autoComplete: 'tel-national', helperText: 'Ideally with WhatsApp.' })}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="country"
                  control={control}
                  render={({ field, fieldState }) => (
                    <CountrySelect name="country" label="Country of residence" required value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="nationality"
                  control={control}
                  render={({ field, fieldState }) => (
                    <CountrySelect name="nationality" label="Nationality" required value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}
                />
              </Grid>
              <Grid size={12}>{text('address', 'Residential address', { required: true, autoComplete: 'street-address' })}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{text('city', 'City', { required: true, autoComplete: 'address-level2' })}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{text('postalCode', 'Postal code', { required: true, autoComplete: 'postal-code' })}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{text('drivingLicenceNumber', 'Driving licence number', { helperText: 'Optional. You can also show it at pickup.' })}</Grid>
            </Grid>
          </Section>

          <Section title="Travel details" subtitle="Optional, but it helps us deliver your car on time if your flight is late.">
            <Grid container spacing={2}>
              {needs.pickupAddress && (
                <Grid size={12}>{text('pickupAddress', 'Delivery address (hotel or address)', { required: true, helperText: `Where should we deliver the car? (${quote?.search.pickupLocation.name})` })}</Grid>
              )}
              {needs.returnAddress && (
                <Grid size={12}>{text('returnAddress', 'Collection address (hotel or address)', { required: true, helperText: `Where should we collect the car? (${quote?.search.returnLocation.name})` })}</Grid>
              )}
              <Grid size={{ xs: 12, sm: 4 }}>{text('flightNumber', 'Flight number', { placeholder: 'e.g. MK015' })}</Grid>
              <Grid size={{ xs: 7, sm: 4 }}>
                <Controller
                  name="arrivalDate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label="Arrival date"
                      value={field.value ? fromIsoDate(field.value) : null}
                      onChange={(d) => field.onChange(d && !Number.isNaN(d.getTime()) ? toIsoDate(d) : '')}
                      format="d MMM yyyy"
                      slotProps={{ textField: { fullWidth: true, error: !!fieldState.error, helperText: fieldState.error?.message }, field: { clearable: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 5, sm: 4 }}>{text('arrivalTime', 'Arrival time', { type: 'time', slotProps: { inputLabel: { shrink: true } } })}</Grid>
              <Grid size={12}>{text('accommodation', 'Hotel / accommodation name')}</Grid>
              <Grid size={12}>{text('specialRequests', 'Special requests', { multiline: true, minRows: 3, placeholder: 'Anything we should know?' })}</Grid>
            </Grid>
          </Section>

          {submitError && <Alert severity="error">{submitError}</Alert>}

          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={2} justifyContent="space-between">
            <Button startIcon={<ArrowBackIcon />} onClick={backToCars} size="large">
              Back to cars
            </Button>
            <Button type="submit" variant="contained" size="large" endIcon={<ArrowForwardIcon />} disabled={formState.isSubmitting || !!quoteError || quoteLoading}>
              {formState.isSubmitting ? 'Saving…' : 'Continue to payment'}
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
            <LockOutlinedIcon fontSize="small" />
            <Typography variant="body2">
              Your details are only used for your rental. See our <RouterLink to="/privacy">privacy policy</RouterLink>.
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </BookingLayout>
  );
}
