import { zodResolver } from '@hookform/resolvers/zod';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  InputAdornment,
  ListSubheader,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useBookingSession } from '../hooks/useBookingSession';
import { useCatalog } from '../hooks/useCatalog';
import type { Location, PublicSettings, SearchCriteria } from '../types/api';
import { addDays, combine, defaultSearchDates, minutesBetween, nowInMauritius, rentalDays, splitLocal, TIME_OPTIONS } from '../utils/datetime';
import { formatShortDate, pluralDays } from '../utils/format';
import { searchToQuery } from '../utils/searchParams';
import { DateRangeCalendar, type DateRange } from './DateRangeCalendar';

const DEFAULTS: Pick<PublicSettings, 'minRentalDays' | 'maxRentalDays' | 'minLeadHours'> = { minRentalDays: 3, maxRentalDays: 90, minLeadHours: 24 };
const MAX_ADVANCE_DAYS = 540;

function buildSchema(settings: typeof DEFAULTS) {
  return z
    .object({
      pickupLocation: z.string().min(1, 'Choose a pickup location.'),
      returnLocation: z.string(),
      differentReturn: z.boolean(),
      pickupDate: z.string().min(1, 'Choose a pick-up date.'),
      pickupTime: z.string().min(1, 'Choose a time.'),
      returnDate: z.string().min(1, 'Choose a drop-off date.'),
      returnTime: z.string().min(1, 'Choose a time.'),
    })
    .superRefine((v, ctx) => {
      if (v.differentReturn && !v.returnLocation) ctx.addIssue({ code: 'custom', path: ['returnLocation'], message: 'Choose a drop-off location.' });
      if (!v.pickupDate || !v.returnDate) return;
      const pickup = combine(v.pickupDate, v.pickupTime);
      const ret = combine(v.returnDate, v.returnTime);
      if (minutesBetween(nowInMauritius(), pickup) < settings.minLeadHours * 60) {
        ctx.addIssue({ code: 'custom', path: ['pickupDate'], message: `Online bookings need ${settings.minLeadHours} hours' notice. Call us for an earlier pickup.` });
      }
      if (minutesBetween(pickup, ret) <= 0) {
        ctx.addIssue({ code: 'custom', path: ['returnDate'], message: 'Drop-off must be after pick-up.' });
        return;
      }
      const days = rentalDays(pickup, ret);
      if (days < settings.minRentalDays) ctx.addIssue({ code: 'custom', path: ['returnDate'], message: `The minimum rental is ${settings.minRentalDays} days.` });
      if (days > settings.maxRentalDays) ctx.addIssue({ code: 'custom', path: ['returnDate'], message: `Online bookings are limited to ${settings.maxRentalDays} days. Contact us for longer.` });
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function initialValues(initial: SearchCriteria | null, locations: Location[]): FormValues {
  if (initial) {
    const p = splitLocal(initial.pickupAt);
    const r = splitLocal(initial.returnAt);
    return {
      pickupLocation: initial.pickupLocation,
      returnLocation: initial.returnLocation,
      differentReturn: initial.pickupLocation !== initial.returnLocation,
      pickupDate: p.date,
      pickupTime: p.time,
      returnDate: r.date,
      returnTime: r.time,
    };
  }
  // Default to the office location shown on mauriconnect.com (the airport).
  const office = locations.find((l) => l.type === 'Office') ?? locations[0];
  return { pickupLocation: office?.code ?? '', returnLocation: '', differentReturn: false, ...defaultSearchDates() };
}

function LocationSelect({ value, onChange, label, error, helperText, locations }: { value: string; onChange: (v: string) => void; label: string; error?: boolean; helperText?: string; locations: Location[] }) {
  const offices = locations.filter((l) => l.type === 'Office');
  const zones = locations.filter((l) => l.type === 'DeliveryZone');
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      helperText={helperText}
      slotProps={{ input: { startAdornment: <InputAdornment position="start"><PlaceOutlinedIcon color="primary" /></InputAdornment> } }}
    >
      {offices.length > 0 && <ListSubheader>Our office</ListSubheader>}
      {offices.map((l) => (
        <MenuItem key={l.code} value={l.code}>
          {l.name}
        </MenuItem>
      ))}
      {zones.length > 0 && <ListSubheader>Free delivery to your address</ListSubheader>}
      {zones.map((l) => (
        <MenuItem key={l.code} value={l.code}>
          {l.name}
        </MenuItem>
      ))}
    </TextField>
  );
}

/** Read-only field that opens the range calendar; looks like the other inputs. */
function DateField({ label, value, active, error, helperText, onOpen }: { label: string; value: string; active: boolean; error?: boolean; helperText?: string; onOpen: () => void }) {
  return (
    <TextField
      label={label}
      value={value ? formatShortDate(value) : ''}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          onOpen();
        }
      }}
      focused={active || undefined}
      error={error}
      helperText={helperText}
      slotProps={{
        input: {
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <EventOutlinedIcon color="primary" />
            </InputAdornment>
          ),
          sx: { cursor: 'pointer', '& input': { cursor: 'pointer' } },
        },
        htmlInput: { 'aria-haspopup': 'dialog', 'aria-expanded': active },
      }}
    />
  );
}

function TimeSelect({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: boolean }) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      slotProps={{
        input: { startAdornment: <InputAdornment position="start"><AccessTimeIcon color="primary" fontSize="small" /></InputAdornment> },
        select: { MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } } },
      }}
    >
      {TIME_OPTIONS.map((t) => (
        <MenuItem key={t} value={t}>
          {t}
        </MenuItem>
      ))}
    </TextField>
  );
}

/**
 * Search bar: location | pick-up date | time | drop-off date | time | search.
 * Both dates are chosen in one calendar: first click pick-up, second click drop-off.
 */
export function SearchForm({ initial = null, onSearched }: { initial?: SearchCriteria | null; variant?: 'hero' | 'compact'; onSearched?: () => void }) {
  const { config, locations, loading } = useCatalog();
  const { dispatch } = useBookingSession();
  const navigate = useNavigate();
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down('sm'));
  const settings = config?.settings ?? DEFAULTS;
  const schema = useMemo(() => buildSchema(settings), [settings]);

  const { control, handleSubmit, setValue, getValues, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: initialValues(initial, locations),
    resetOptions: { keepDirtyValues: true },
  });
  const [differentReturn, pickupDate, pickupTime, returnDate, returnTime] = useWatch({ control, name: ['differentReturn', 'pickupDate', 'pickupTime', 'returnDate', 'returnTime'] });

  // Range calendar state: what is picked so far, and which end the next click sets.
  const datesRef = useRef<HTMLDivElement>(null);
  const [calendar, setCalendar] = useState<{ focus: 'start' | 'end'; range: DateRange } | null>(null);
  const today = nowInMauritius().slice(0, 10);
  const minDate = addDays(today, 1); // 24 hours' notice: tomorrow is the earliest possible day
  const maxDate = addDays(today, MAX_ADVANCE_DAYS);

  const openCalendar = (focus: 'start' | 'end') => setCalendar({ focus, range: { start: getValues('pickupDate') || null, end: getValues('returnDate') || null } });

  const validateAfterChange = { shouldValidate: formState.isSubmitted, shouldDirty: true };

  const closeCalendar = () => {
    // Only a pick-up was chosen: keep a sensible drop-off so the search still works.
    if (calendar?.range.start && !calendar.range.end) {
      const start = calendar.range.start;
      const current = getValues('returnDate');
      const fallback = current && current >= addDays(start, settings.minRentalDays) ? current : addDays(start, Math.max(settings.minRentalDays, 7));
      setValue('returnDate', fallback, validateAfterChange);
    }
    setCalendar(null);
  };

  const onRangeChange = (range: DateRange, focus: 'start' | 'end', complete: boolean) => {
    if (range.start) setValue('pickupDate', range.start, validateAfterChange);
    if (range.end) setValue('returnDate', range.end, validateAfterChange);
    if (complete) setCalendar(null);
    else setCalendar({ focus, range });
  };

  const days = pickupDate && returnDate ? rentalDays(combine(pickupDate, pickupTime), combine(returnDate, returnTime)) : 0;
  const pending = calendar?.range;

  const onSubmit = (v: FormValues) => {
    const criteria: SearchCriteria = {
      pickupLocation: v.pickupLocation,
      returnLocation: v.differentReturn ? v.returnLocation : v.pickupLocation,
      pickupAt: combine(v.pickupDate, v.pickupTime),
      returnAt: combine(v.returnDate, v.returnTime),
    };
    dispatch({ type: 'search', search: criteria });
    navigate(`/booking/cars?${searchToQuery(criteria)}`);
    onSearched?.();
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} aria-label="Search for a rental car">
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          alignItems: 'start',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            md: differentReturn ? '1.2fr 1.2fr 1.15fr 0.85fr 1.15fr 0.85fr auto' : '1.6fr 1.15fr 0.85fr 1.15fr 0.85fr auto',
          },
          gridTemplateAreas: {
            xs: differentReturn ? '"loc loc" "ret ret" "pd pt" "rd rt" "btn btn"' : '"loc loc" "pd pt" "rd rt" "btn btn"',
            md: differentReturn ? '"loc ret pd pt rd rt btn"' : '"loc pd pt rd rt btn"',
          },
        }}
      >
        <Box sx={{ gridArea: 'loc' }}>
          <Controller
            name="pickupLocation"
            control={control}
            render={({ field, fieldState }) => (
              <LocationSelect label="Pick-up location" value={field.value} onChange={field.onChange} error={!!fieldState.error} helperText={fieldState.error?.message} locations={locations} />
            )}
          />
        </Box>
        {differentReturn && (
          <Box sx={{ gridArea: 'ret' }}>
            <Controller
              name="returnLocation"
              control={control}
              render={({ field, fieldState }) => (
                <LocationSelect label="Drop-off location" value={field.value} onChange={field.onChange} error={!!fieldState.error} helperText={fieldState.error?.message} locations={locations} />
              )}
            />
          </Box>
        )}

        {/* Both date fields open the same calendar, anchored under the pick-up date. */}
        <Box sx={{ gridArea: 'pd' }} ref={datesRef}>
          <Controller
            name="pickupDate"
            control={control}
            render={({ field, fieldState }) => (
              <DateField
                label="Pick-up date"
                value={pending?.start ?? field.value}
                active={calendar?.focus === 'start'}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onOpen={() => openCalendar('start')}
              />
            )}
          />
        </Box>
        <Box sx={{ gridArea: 'pt' }}>
          <Controller name="pickupTime" control={control} render={({ field, fieldState }) => <TimeSelect label="Time" value={field.value} onChange={field.onChange} error={!!fieldState.error} />} />
        </Box>
        <Box sx={{ gridArea: 'rd' }}>
          <Controller
            name="returnDate"
            control={control}
            render={({ field, fieldState }) => (
              <DateField
                label="Drop-off date"
                value={pending ? (pending.end ?? '') : field.value}
                active={calendar?.focus === 'end'}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onOpen={() => openCalendar(getValues('pickupDate') ? 'end' : 'start')}
              />
            )}
          />
        </Box>
        <Box sx={{ gridArea: 'rt' }}>
          <Controller name="returnTime" control={control} render={({ field, fieldState }) => <TimeSelect label="Time" value={field.value} onChange={field.onChange} error={!!fieldState.error} />} />
        </Box>
        <Box sx={{ gridArea: 'btn' }}>
          <Button
            type="submit"
            size="large"
            variant="contained"
            color="secondary"
            startIcon={<SearchIcon />}
            disabled={loading || locations.length === 0}
            fullWidth
            sx={{ height: 56, whiteSpace: 'nowrap', px: 3 }}
          >
            Search
          </Button>
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} alignItems={{ sm: 'center' }} sx={{ mt: 1.5 }}>
        <Controller
          name="differentReturn"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} size="small" />}
              label={<Typography variant="body2">Drop car off at a different location</Typography>}
            />
          )}
        />
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1} alignItems="center">
          {days > 0 && <Chip size="small" color="primary" variant="outlined" label={pluralDays(days)} />}
          <Typography variant="caption" color="text.secondary">
            Mauritius time (GMT+4) · minimum {settings.minRentalDays} days
          </Typography>
        </Stack>
      </Stack>

      <Popover
        open={!!calendar}
        anchorEl={datesRef.current}
        onClose={closeCalendar}
        anchorOrigin={{ vertical: 'bottom', horizontal: narrow ? 'center' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: narrow ? 'center' : 'left' }}
        slotProps={{ paper: { sx: { mt: 1, borderRadius: 3, boxShadow: '0 16px 48px rgba(16,38,64,.22)', width: narrow ? 'calc(100vw - 24px)' : 'auto', maxWidth: 'calc(100vw - 24px)' } } }}
        aria-label="Choose pick-up and drop-off dates"
      >
        {calendar && (
          <>
            <DateRangeCalendar
              value={calendar.range}
              focus={calendar.focus}
              onChange={onRangeChange}
              minDate={minDate}
              maxDate={maxDate}
              minNights={settings.minRentalDays}
              months={narrow ? 1 : 2}
            />
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1.5 }}>
              <Typography variant="body2" color="text.secondary" aria-live="polite">
                {calendar.focus === 'start' || !calendar.range.start
                  ? 'Select your pick-up date'
                  : calendar.range.end
                    ? `${formatShortDate(calendar.range.start)} → ${formatShortDate(calendar.range.end)}`
                    : `Pick-up ${formatShortDate(calendar.range.start)} · now select your drop-off date (minimum ${settings.minRentalDays} days)`}
              </Typography>
              <Button onClick={closeCalendar} variant="text">
                Done
              </Button>
            </Stack>
          </>
        )}
      </Popover>
    </Box>
  );
}
