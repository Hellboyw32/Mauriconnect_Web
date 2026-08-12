import type {
  Booking,
  BookingsSearchState,
  CarInsuranceRenewalReportItem,
  Filters,
  FitnessRenewalReportItem,
  RoadTaxRenewalReportItem
} from '@libs/types';
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
import { useCarFitnessRenewalReport } from 'src/hooks/reports/use-car-fitness-renewal-report';
import { useCarInsuranceRenewalReport } from 'src/hooks/reports/use-car-insurance-renewal-report';
import { useDailyScheduleReport } from 'src/hooks/reports/use-daily-schedule-report';
import { useDropoffScheduleReport } from 'src/hooks/reports/use-dropoff-schedule-report';
import { useRoadTaxRenewalReport } from 'src/hooks/reports/use-road-tax-renewal-report';
import CarFitnessRenewalReport from 'src/sections/report/CarFitnessRenewalReport';
import CarInsuranceRenewalReport from 'src/sections/report/CarInsuranceRenewalReport';
import DailyScheduleReport from 'src/sections/report/DailyScheduleReport';
import RoadTaxRenewalReport from 'src/sections/report/RoadTaxRenewalReport';

const MONTH_ONLY_REPORT_TYPES = ['40', '50', '60'];

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
  const [dropoffReportData, setDropoffReportData] = React.useState<Booking[]>([]);
  const [pickupDate, setPickupDate] = React.useState<Date | null>(new Date());
  const [dropoffDate, setDropoffDate] = React.useState<Date | null>(new Date());
  const [renewalMonth, setRenewalMonth] = React.useState<Date | null>(new Date());
  const [roadTaxReportData, setRoadTaxReportData] = React.useState<RoadTaxRenewalReportItem[]>(
    []
  );
  const [carFitnessReportData, setCarFitnessReportData] = React.useState<
    FitnessRenewalReportItem[]
  >([]);
  const [carInsuranceReportData, setCarInsuranceReportData] = React.useState<
    CarInsuranceRenewalReportItem[]
  >([]);
  const dailyScheduleStore = useDailyScheduleReport();
  const dropoffScheduleStore = useDropoffScheduleReport();
  const roadTaxRenewalStore = useRoadTaxRenewalReport();
  const carFitnessRenewalStore = useCarFitnessRenewalReport();
  const carInsuranceRenewalStore = useCarInsuranceRenewalReport();

  const handleChange = (event: SelectChangeEvent) => {
    const report = event.target.value;
    setReportType(report);
    // Reset report data when changing report type
    if (report !== '10') {
      setReportData([]);
    }
    if (report !== '40') {
      setRoadTaxReportData([]);
    }
    if (report !== '50') {
      setCarFitnessReportData([]);
    }
    if (report !== '60') {
      setCarInsuranceReportData([]);
    }
  };

  const handleRunReport = useCallback(async () => {
    if (reportType && reportType === '10') {
      // Format the dates as ISO strings for the API
      const pickupDateStr = pickupDate ? pickupDate.toISOString().split('T')[0] : undefined;
      const dropoffDateStr = dropoffDate ? dropoffDate.toISOString().split('T')[0] : undefined;

      console.log(
        'Running report with pickup date:',
        pickupDateStr,
        'dropoff date:',
        dropoffDateStr
      );

      // Fetch both pickup and dropoff schedules
      const pickupData = await dailyScheduleStore.handleBookingGet(pickupDateStr);
      const dropoffData = await dropoffScheduleStore.handleBookingGet(dropoffDateStr);

      console.log('Pickup data:', pickupData);
      console.log('Dropoff data:', dropoffData);

      setReportData(pickupData);
      setDropoffReportData(dropoffData);
    }

    if (reportType && MONTH_ONLY_REPORT_TYPES.includes(reportType) && renewalMonth) {
      const year = renewalMonth.getFullYear();
      const month = renewalMonth.getMonth() + 1;

      if (reportType === '40') {
        const data = await roadTaxRenewalStore.handleReportGet(year, month);
        setRoadTaxReportData(data);
      } else if (reportType === '50') {
        const data = await carFitnessRenewalStore.handleReportGet(year, month);
        setCarFitnessReportData(data);
      } else if (reportType === '60') {
        const data = await carInsuranceRenewalStore.handleReportGet(year, month);
        setCarInsuranceReportData(data);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reportType,
    dailyScheduleStore,
    dropoffScheduleStore,
    pickupDate,
    dropoffDate,
    roadTaxRenewalStore,
    carFitnessRenewalStore,
    carInsuranceRenewalStore,
    renewalMonth
  ]);
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
          <MenuItem value="10">Daily Schedule Report</MenuItem>
          <MenuItem value="20">Availability Report</MenuItem>
          <MenuItem value="30">Settlement Report</MenuItem>
          <MenuItem value="40">RoadTax ReNew</MenuItem>
          <MenuItem value="50">Car Fitness ReNew</MenuItem>
          <MenuItem value="60">Car Insurance ReNew</MenuItem>
        </Select>
        {/* <FormHelperText>select report and click on run</FormHelperText> */}
      </FormControl>
      {MONTH_ONLY_REPORT_TYPES.includes(reportType) ? (
        <Box
          component="div"
          sx={{ p: 2, border: '1px grey' }}
        >
          <DatePicker
            label="Month"
            views={['year', 'month']}
            openTo="month"
            format="MM/yyyy"
            value={renewalMonth}
            onChange={(newValue) => setRenewalMonth(newValue)}
          />
        </Box>
      ) : (
        <Box
          component="div"
          sx={{ p: 2, border: '1px grey' }}
        >
          <DatePicker
            label="Pickup"
            value={pickupDate}
            onChange={(newValue) => setPickupDate(newValue)}
          />
          <DatePicker
            label="Drop"
            value={dropoffDate}
            onChange={(newValue) => setDropoffDate(newValue)}
          />
        </Box>
      )}

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
      {reportType === '10' && (reportData.length > 0 || dropoffReportData.length > 0) && (
        <Box>
          <DailyScheduleReport
            bookings={reportData}
            dropoffBookings={dropoffReportData}
          />
        </Box>
      )}
      {reportType === '40' && roadTaxReportData.length > 0 && (
        <Box>
          <RoadTaxRenewalReport items={roadTaxReportData} />
        </Box>
      )}
      {reportType === '50' && carFitnessReportData.length > 0 && (
        <Box>
          <CarFitnessRenewalReport items={carFitnessReportData} />
        </Box>
      )}
      {reportType === '60' && carInsuranceReportData.length > 0 && (
        <Box>
          <CarInsuranceRenewalReport items={carInsuranceReportData} />
        </Box>
      )}
    </div>
  );
}
