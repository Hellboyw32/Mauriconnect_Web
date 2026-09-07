import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import CalendarIcon from '@untitled-ui/icons-react/build/esm/Calendar';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { MultiSectionDigitalClock } from '@mui/x-date-pickers/MultiSectionDigitalClock';
import { format as formatDate } from 'date-fns';
import { useState, type FC, type MouseEvent } from 'react';

interface DateTimePickerSideBySideProps {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  format?: string;
  fullWidth?: boolean;
}

const mergeDate = (base: Date | null, datePart: Date): Date => {
  const merged = base ? new Date(base) : new Date(datePart);
  merged.setFullYear(datePart.getFullYear(), datePart.getMonth(), datePart.getDate());
  return merged;
};

const mergeTime = (base: Date | null, timePart: Date): Date => {
  const merged = base ? new Date(base) : new Date(timePart);
  merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return merged;
};

// Shows the calendar and the hour/minute/AM-PM columns together in one panel, instead
// of MUI's default DateTimePicker which steps through them as separate views - built
// by composing the DateCalendar and MultiSectionDigitalClock sub-components directly
// rather than relying on DateTimePicker's single-active-view popup.
export const DateTimePickerSideBySide: FC<DateTimePickerSideBySideProps> = (props) => {
  const { label, value, onChange, format = 'dd/MM/yyyy hh:mm a', fullWidth = true } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pendingValue, setPendingValue] = useState<Date | null>(value);

  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>): void => {
    setPendingValue(value ?? new Date());
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleAccept = (): void => {
    onChange(pendingValue);
    handleClose();
  };

  const handleDateChange = (newDate: Date | null): void => {
    if (!newDate) {
      return;
    }
    setPendingValue((prev) => mergeDate(prev, newDate));
  };

  const handleTimeChange = (newTime: Date | null): void => {
    if (!newTime) {
      return;
    }
    setPendingValue((prev) => mergeTime(prev, newTime));
  };

  return (
    <>
      <TextField
        label={label}
        value={value ? formatDate(value, format) : ''}
        onClick={handleOpen}
        fullWidth={fullWidth}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={handleOpen}
              >
                <SvgIcon fontSize="small">
                  <CalendarIcon />
                </SvgIcon>
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack
          direction="row"
          divider={
            <Divider
              orientation="vertical"
              flexItem
            />
          }
        >
          <DateCalendar
            value={pendingValue}
            onChange={handleDateChange}
            sx={{ width: 320, flexShrink: 0 }}
          />
          <MultiSectionDigitalClock
            value={pendingValue}
            onChange={handleTimeChange}
            ampm
            sx={{
              flexShrink: 0,
              // Each hours/minutes/meridiem column is a scrollable <ul> only ~56px
              // wide by default - too narrow for the native scrollbar to sit beside
              // the two-digit text without overlapping it. Widen the columns.
              '& .MuiList-root': {
                width: 90
              }
            }}
          />
        </Stack>
        <Divider />
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1}
          sx={{ p: 1 }}
        >
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAccept}>OK</Button>
        </Stack>
      </Popover>
    </>
  );
};
