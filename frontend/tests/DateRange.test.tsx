import { ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DateRangeCalendar } from '../src/components/DateRangeCalendar';
import { SearchForm } from '../src/components/SearchForm';
import { BookingSessionProvider } from '../src/hooks/useBookingSession';
import { CatalogProvider } from '../src/hooks/useCatalog';
import { theme } from '../src/theme/theme';

vi.mock('../src/services/catalogService', () => ({
  catalogService: {
    config: async () => ({
      paymentProvider: 'fake',
      paypalClientId: null,
      settings: { minRentalDays: 3, maxRentalDays: 90, minLeadHours: 24, openingTime: '08:00', closingTime: '18:00', holdMinutes: 30, currency: 'EUR', timeZone: 'Indian/Mauritius' },
    }),
    locations: async () => [{ code: 'ssr-airport', name: 'SSR Intl Airport', type: 'Office', address: null, deliveryFee: 0, requiresAddress: false }],
    extras: async () => [],
  },
}));

const day = (label: RegExp) => screen.getByRole('button', { name: label });

describe('DateRangeCalendar', () => {
  const setup = (props: Partial<React.ComponentProps<typeof DateRangeCalendar>> = {}) => {
    const onChange = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <DateRangeCalendar value={{ start: null, end: null }} focus="start" onChange={onChange} minDate="2026-12-02" maxDate="2027-12-31" minNights={3} {...props} />
      </ThemeProvider>,
    );
    return onChange;
  };

  it('shows two months, Monday first', () => {
    setup();
    expect(screen.getByText('December 2026')).toBeInTheDocument();
    expect(screen.getByText('January 2027')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Mon');
  });

  it('first click sets the pick-up and moves on to the drop-off', async () => {
    const onChange = setup();
    await userEvent.click(day(/^Tuesday 8 December 2026/));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-12-08', end: null }, 'end', false);
  });

  it('second click completes the range', async () => {
    const onChange = setup({ value: { start: '2026-12-08', end: null }, focus: 'end' });
    await userEvent.click(day(/^Sunday 27 December 2026/));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-12-08', end: '2026-12-27' }, 'start', true);
  });

  it('restarts the range when the drop-off click is before the pick-up', async () => {
    const onChange = setup({ value: { start: '2026-12-08', end: null }, focus: 'end' });
    await userEvent.click(day(/^Saturday 5 December 2026/));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-12-05', end: null }, 'end', false);
  });

  it('disables past dates and drop-offs shorter than the minimum rental', () => {
    setup({ value: { start: '2026-12-08', end: null }, focus: 'end' });
    expect(day(/^Tuesday 1 December 2026/)).toBeDisabled();
    expect(day(/^Thursday 10 December 2026/)).toBeDisabled();
    expect(day(/^Friday 11 December 2026/)).toBeEnabled();
  });

  it('keeps a valid drop-off when only the pick-up is changed', async () => {
    const onChange = setup({ value: { start: '2026-12-08', end: '2026-12-27' }, focus: 'start' });
    await userEvent.click(day(/^Thursday 10 December 2026/));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-12-10', end: '2026-12-27' }, 'end', false);
  });
});

function CurrentUrl() {
  const location = useLocation();
  return <output data-testid="url">{location.pathname + location.search}</output>;
}

describe('SearchForm date range', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-22T08:00:00Z')); // 12:00 in Mauritius
  });
  afterEach(() => vi.useRealTimers());

  it('picks pick-up and drop-off in two clicks and searches', async () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/']}>
          <CatalogProvider>
            <BookingSessionProvider>
              <Routes>
                <Route path="*" element={<><SearchForm /><CurrentUrl /></>} />
              </Routes>
            </BookingSessionProvider>
          </CatalogProvider>
        </MemoryRouter>
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled());

    await userEvent.click(screen.getByLabelText('Pick-up date'));
    // Default range is shown; navigate to December and choose 8 → 27.
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    await userEvent.click(day(/^Tuesday 8 December 2026/));
    expect(screen.getByLabelText('Drop-off date')).toHaveValue('');
    await userEvent.click(day(/^Sunday 27 December 2026/));

    await waitFor(() => expect(screen.queryByRole('button', { name: /^Sunday 27 December 2026/ })).not.toBeInTheDocument());
    expect(screen.getByLabelText('Pick-up date')).toHaveValue('Tue 8 Dec');
    expect(screen.getByLabelText('Drop-off date')).toHaveValue('Sun 27 Dec');
    expect(screen.getByText('19 days')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() =>
      expect(screen.getByTestId('url')).toHaveTextContent('/booking/cars?from=ssr-airport&to=ssr-airport&pickup=2026-12-08T10%3A00&return=2026-12-27T10%3A00'),
    );
  });
});
