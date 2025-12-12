import type { Booking, BookingsSearchState, Filters } from '@libs/types';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useDailyScheduleReport } from 'src/hooks/reports/use-daily-schedule-report';
import DailyScheduleReport from 'src/sections/report/DailyScheduleReport';

const useBookingsSearch = () => {
  const [state, setState] = useState<BookingsSearchState>({
    filters: {
      customerName: undefined,
      pickupDate: undefined,
      dropoffDate: undefined
    },
    page: 0,
    rowsPerPage: -1,
    sortBy: 'customerName',
    sortDir: 'asc'
  });
};

export default function SelectLabels() {
  const [reportType, setReportType] = React.useState('');
  const [reportData, setReportData] = React.useState<Booking[]>([]);
  const dailyScheduleStore = useDailyScheduleReport();

  const handleChange = (event: SelectChangeEvent) => {
    const report = event.target.value;
    setReportType(report);
  };

  const handleRunReport = useCallback(async () => {
    if (reportType && reportType == '10') {
      const data = await dailyScheduleStore.handleBookingGet();
      console.log(data);
      setReportData(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dailyScheduleStore]);
  return (
    <div>
      <FormControl sx={{ m: 1, minWidth: 300 }}>
        <InputLabel id="demo-simple-select-helper-label">Reports</InputLabel>
        <Select
          labelId="demo-simple-select-helper-label"
          id="demo-simple-select-helper"
          value={reportType}
          label="Reports"
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Daily Schedule Report</MenuItem>
          <MenuItem value={20}>Availability Report</MenuItem>
          <MenuItem value={30}>Settlement Report</MenuItem>
        </Select>
        {/* <FormHelperText>select report and click on run</FormHelperText> */}
      </FormControl>
      <Box
        component="div"
        sx={{ p: 2, border: '1px grey' }}
      >
        <DatePicker label="Pickup" />
        <DatePicker label="Drop" />
      </Box>

      <Box
        component="div"
        sx={{ p: 2, border: '1px grey' }}
      >
        <Button
          onClick={handleRunReport}
          variant="contained"
        >
          Run Report
        </Button>
      </Box>
      <Box>
        <DailyScheduleReport bookings={reportData} />
      </Box>
    </div>
  );
}
