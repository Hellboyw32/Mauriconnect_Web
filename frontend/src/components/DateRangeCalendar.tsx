import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, ButtonBase, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { addDays } from '../utils/datetime';

/*
  Two-month range calendar (pick-up → drop-off) in the style of the big rental sites:
  the first click sets the start, the second the end. Dates are "YYYY-MM-DD" strings,
  so string comparison is date comparison and no time zone can shift a day.
*/

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const monthKey = (date: string) => date.slice(0, 7); // "YYYY-MM"

function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** Days of a month grid, Monday first; null for leading blanks. */
function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${month}-${String(d).padStart(2, '0')}`);
  return cells;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Tuesday 8 December 2026": built by hand so every browser announces the same text. */
function longLabel(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return `${DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d} ${MONTHS[m - 1]} ${y}`;
}

export interface DateRange {
  start: string | null;
  end: string | null;
}

interface Props {
  value: DateRange;
  /** Which end of the range the next click sets. */
  focus: 'start' | 'end';
  onChange: (range: DateRange, nextFocus: 'start' | 'end', complete: boolean) => void;
  minDate: string;
  maxDate: string;
  /** Drop-off must be at least this many days after pick-up. */
  minNights: number;
  months?: 1 | 2;
}

export function DateRangeCalendar({ value, focus, onChange, minDate, maxDate, minNights, months = 2 }: Props) {
  const [first, setFirst] = useState(() => monthKey(value.start ?? minDate));
  const [hover, setHover] = useState<string | null>(null);
  const { start, end } = value;

  const canGoBack = first > monthKey(minDate);
  const canGoForward = addMonths(first, months - 1) < monthKey(maxDate);

  const choosingEnd = focus === 'end' && !!start;
  const earliestEnd = start ? addDays(start, minNights) : minDate;
  const isDisabled = (d: string) => d < minDate || d > maxDate || (choosingEnd && d > start! && d < earliestEnd);

  // While choosing the end, hovering previews the range.
  const rangeEnd = choosingEnd && hover && hover > start! ? hover : end;

  const pick = (d: string) => {
    if (!choosingEnd || d <= start!) {
      // New pick-up date: keep the old drop-off only if it still leaves the minimum rental.
      const keepEnd = focus === 'start' && end && end >= addDays(d, minNights) ? end : null;
      onChange({ start: d, end: keepEnd }, 'end', false);
      return;
    }
    onChange({ start, end: d }, 'start', true);
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, userSelect: 'none' }} onMouseLeave={() => setHover(null)}>
      <Stack direction="row" spacing={{ xs: 0, sm: 4 }}>
        {Array.from({ length: months }, (_, i) => addMonths(first, i)).map((month, i) => {
          const [y, m] = month.split('-').map(Number);
          return (
            <Box key={month} sx={{ width: { xs: '100%', sm: 300 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, minHeight: 40 }}>
                <Box sx={{ width: 40 }}>
                  {i === 0 && (
                    <IconButton aria-label="Previous month" onClick={() => setFirst((f) => addMonths(f, -1))} disabled={!canGoBack}>
                      <ChevronLeftIcon />
                    </IconButton>
                  )}
                </Box>
                <Typography fontWeight={700} aria-live="polite">
                  {MONTHS[m - 1]} {y}
                </Typography>
                <Box sx={{ width: 40 }}>
                  {i === months - 1 && (
                    <IconButton aria-label="Next month" onClick={() => setFirst((f) => addMonths(f, 1))} disabled={!canGoForward}>
                      <ChevronRightIcon />
                    </IconButton>
                  )}
                </Box>
              </Stack>
              <Box role="grid" aria-label={`${MONTHS[m - 1]} ${y}`} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 0.5 }}>
                {WEEKDAYS.map((w) => (
                  <Typography key={w} role="columnheader" variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 0.75 }}>
                    {w}
                  </Typography>
                ))}
                {monthGrid(month).map((d, idx) => {
                  if (!d) return <Box key={`blank-${idx}`} />;
                  const disabled = isDisabled(d);
                  const isStart = d === start;
                  const isEnd = d === rangeEnd;
                  const inRange = !!start && !!rangeEnd && d > start && d < rangeEnd;
                  const selected = isStart || isEnd;
                  return (
                    <Box
                      key={d}
                      role="gridcell"
                      sx={{
                        // Range band behind the day buttons.
                        bgcolor: inRange || (selected && start && rangeEnd && start !== rangeEnd) ? 'rgba(11,79,138,.10)' : 'transparent',
                        borderTopLeftRadius: isStart ? 10 : 0,
                        borderBottomLeftRadius: isStart ? 10 : 0,
                        borderTopRightRadius: isEnd ? 10 : 0,
                        borderBottomRightRadius: isEnd ? 10 : 0,
                      }}
                    >
                      <ButtonBase
                        onClick={() => pick(d)}
                        onMouseEnter={() => setHover(d)}
                        onFocus={() => setHover(d)}
                        disabled={disabled}
                        aria-label={`${longLabel(d)}${isStart ? ', pick-up' : ''}${isEnd ? ', drop-off' : ''}`}
                        aria-pressed={selected}
                        sx={{
                          width: '100%',
                          height: 42,
                          borderRadius: 2.5,
                          fontSize: '0.95rem',
                          fontWeight: selected || inRange ? 700 : 500,
                          color: disabled ? 'text.disabled' : selected ? '#fff' : 'text.primary',
                          bgcolor: selected ? 'primary.main' : 'transparent',
                          textDecoration: disabled && d >= minDate ? 'none' : undefined,
                          '&:hover': { bgcolor: selected ? 'primary.dark' : 'rgba(11,79,138,.12)' },
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
                        }}
                      >
                        {Number(d.slice(8))}
                      </ButtonBase>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
