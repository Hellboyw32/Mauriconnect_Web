import type { Filters } from '@libs/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchMdIcon from '@untitled-ui/icons-react/build/esm/SearchMd';
import PropTypes from 'prop-types';
import type { ChangeEvent, FC } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useUpdateEffect } from 'src/hooks/use-update-effect';
import { timestampToDate } from 'src/utils/date-locale';

type SortValue = 'LastModifiedTimeStamp|desc' | 'LastModifiedTimeStamp|asc';

interface SortOption {
  label: string;
  value: SortValue;
}

const sortOptions: SortOption[] = [
  {
    label: 'Last modified (newest)',
    value: 'LastModifiedTimeStamp|desc'
  },
  {
    label: 'Last modified (oldest)',
    value: 'LastModifiedTimeStamp|asc'
  }
];

type SortDir = 'asc' | 'desc';

interface SearchChip {
  label: string;
  field: 'customerName' | 'pickupDate' | 'dropoffDate' | 'referenceNo' | 'carNumber';
  value: unknown;
  displayValue?: unknown;
}

interface BookingListSearchProps {
  onFiltersChange?: (filters: Filters) => void;
  onSortChange?: (sort: { sortBy: string; sortDir: SortDir }) => void;
  sortBy?: string;
  sortDir?: SortDir;
  filters?: Filters;
}

const buildInitialChips = (filters?: Filters): SearchChip[] => {
  const chips: SearchChip[] = [];

  if (filters?.customerName) {
    chips.push({ label: 'Customer Name', field: 'customerName', value: filters.customerName });
  }

  if (filters?.referenceNo) {
    chips.push({ label: 'Reference No', field: 'referenceNo', value: filters.referenceNo });
  }

  if (filters?.carNumber) {
    chips.push({ label: 'Car Number', field: 'carNumber', value: filters.carNumber });
  }

  if (filters?.pickupDate) {
    const date = new Date(filters.pickupDate);
    chips.push({
      label: 'Pickup Date',
      field: 'pickupDate',
      value: date,
      displayValue: timestampToDate(date)
    });
  }

  if (filters?.dropoffDate) {
    const date = new Date(filters.dropoffDate);
    chips.push({
      label: 'Dropoff Date',
      field: 'dropoffDate',
      value: date,
      displayValue: timestampToDate(date)
    });
  }

  return chips;
};

export const BookingListSearch: FC<BookingListSearchProps> = (props) => {
  const { onFiltersChange, onSortChange, sortBy, sortDir, filters } = props;
  const queryRef = useRef<HTMLInputElement | null>(null);
  const referenceNoRef = useRef<HTMLInputElement | null>(null);
  const carNumberRef = useRef<HTMLInputElement | null>(null);
  const [chips, setChips] = useState<SearchChip[]>(() => buildInitialChips(filters));
  const [pickupDate, setPickupDate] = useState<Date | null>(
    filters?.pickupDate ? new Date(filters.pickupDate) : null
  );
  const [dropoffDate, setDropoffDate] = useState<Date | null>(
    filters?.dropoffDate ? new Date(filters.dropoffDate) : null
  );

  // Reset fields when filters are cleared from parent
  useUpdateEffect(() => {
    if (
      !filters?.customerName &&
      !filters?.pickupDate &&
      !filters?.dropoffDate &&
      !filters?.referenceNo &&
      !filters?.carNumber
    ) {
      setChips((prevChips) => (prevChips.length > 0 ? [] : prevChips));
      setPickupDate(null);
      setDropoffDate(null);
      if (queryRef.current) {
        queryRef.current.value = '';
      }
      if (referenceNoRef.current) {
        referenceNoRef.current.value = '';
      }
      if (carNumberRef.current) {
        carNumberRef.current.value = '';
      }
    }
  }, [filters]);

  const handleChipsUpdate = useCallback(() => {
    const filters: Filters = {
      customerName: undefined,
      pickupDate: undefined,
      dropoffDate: undefined,
      referenceNo: undefined,
      carNumber: undefined
    };

    chips.forEach((chip) => {
      switch (chip.field) {
        case 'customerName':
          filters.customerName = chip.value as string;
          break;
        case 'pickupDate':
          filters.pickupDate = chip.value as Date;
          break;
        case 'dropoffDate':
          filters.dropoffDate = chip.value as Date;
          break;
        case 'referenceNo':
          filters.referenceNo = chip.value as string;
          break;
        case 'carNumber':
          filters.carNumber = chip.value as string;
          break;
        default:
          break;
      }
    });

    onFiltersChange?.(filters);
  }, [chips, onFiltersChange]);

  useUpdateEffect(() => {
    handleChipsUpdate();
  }, [chips, handleChipsUpdate]);

  const handleChipDelete = useCallback((deletedChip: SearchChip): void => {
    setChips((prevChips) => {
      return prevChips.filter((chip) => {
        return !(deletedChip.field === chip.field && deletedChip.value === chip.value);
      });
    });

    // Reset date states when deleting date chips
    if (deletedChip.field === 'pickupDate') {
      setPickupDate(null);
    }
    if (deletedChip.field === 'dropoffDate') {
      setDropoffDate(null);
    }
  }, []);

  const handlePickupDateChange = useCallback((date: Date | null): void => {
    setPickupDate(date);
  }, []);

  const handleDropoffDateChange = useCallback((date: Date | null): void => {
    setDropoffDate(date);
  }, []);

  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const [sortBy, sortDir] = event.target.value.split('|') as [string, SortDir];

      onSortChange?.({
        sortBy,
        sortDir
      });
    },
    [onSortChange]
  );

  const handleSearchClick = useCallback(
    (event?: any): void => {
      if (event) {
        event.preventDefault();
      }

      const customerName = queryRef.current?.value || '';
      const referenceNo = referenceNoRef.current?.value || '';
      const carNumber = carNumberRef.current?.value || '';
      const newChips: SearchChip[] = [];

      // Add customer name chip
      if (customerName) {
        newChips.push({
          label: 'Customer Name',
          field: 'customerName',
          value: customerName
        });
      }

      // Add reference number chip
      if (referenceNo) {
        newChips.push({
          label: 'Reference No',
          field: 'referenceNo',
          value: referenceNo
        });
      }

      // Add car number chip
      if (carNumber) {
        newChips.push({
          label: 'Car Number',
          field: 'carNumber',
          value: carNumber
        });
      }

      // Add pickup date chip
      if (pickupDate) {
        const value = timestampToDate(pickupDate);
        newChips.push({
          label: 'Pickup Date',
          field: 'pickupDate',
          value: pickupDate,
          displayValue: value
        });
      }

      // Add dropoff date chip
      if (dropoffDate) {
        const value = timestampToDate(dropoffDate);
        newChips.push({
          label: 'Dropoff Date',
          field: 'dropoffDate',
          value: dropoffDate,
          displayValue: value
        });
      }

      setChips(newChips);
    },
    [pickupDate, dropoffDate]
  );

  const showChips = chips.length > 0;

  return (
    <>
      <Box
        component="form"
        onSubmit={handleSearchClick}
        sx={{ p: 3 }}
      >
        <Stack
          alignItems={{ xs: 'stretch', md: 'center' }}
          direction={{ xs: 'column', md: 'row' }}
          flexWrap="wrap"
          spacing={2}
        >
          <OutlinedInput
            defaultValue={filters?.customerName ?? ''}
            inputProps={{ ref: queryRef }}
            placeholder="Search by customer name"
            startAdornment={
              <InputAdornment position="start">
                <SvgIcon>
                  <SearchMdIcon />
                </SvgIcon>
              </InputAdornment>
            }
            sx={{ flex: 1, minWidth: { xs: '100%', md: 200 } }}
          />
          <OutlinedInput
            defaultValue={filters?.referenceNo ?? ''}
            inputProps={{ ref: referenceNoRef }}
            placeholder="Search by reference no"
            startAdornment={
              <InputAdornment position="start">
                <SvgIcon>
                  <SearchMdIcon />
                </SvgIcon>
              </InputAdornment>
            }
            sx={{ flex: 1, minWidth: { xs: '100%', md: 200 } }}
          />
          <OutlinedInput
            defaultValue={filters?.carNumber ?? ''}
            inputProps={{ ref: carNumberRef }}
            placeholder="Search by car number"
            startAdornment={
              <InputAdornment position="start">
                <SvgIcon>
                  <SearchMdIcon />
                </SvgIcon>
              </InputAdornment>
            }
            sx={{ flex: 1, minWidth: { xs: '100%', md: 200 } }}
          />
          <DatePicker
            format="dd/MM/yyyy"
            label="Pickup Date"
            onChange={handlePickupDateChange}
            value={pickupDate}
            slotProps={{
              actionBar: {
                actions: ['clear', 'accept']
              },
              textField: {
                sx: { flex: 1, minWidth: { xs: '100%', md: 180 } }
              }
            }}
          />
          <DatePicker
            format="dd/MM/yyyy"
            label="Dropoff Date"
            onChange={handleDropoffDateChange}
            value={dropoffDate}
            slotProps={{
              actionBar: {
                actions: ['clear', 'accept']
              },
              textField: {
                sx: { flex: 1, minWidth: { xs: '100%', md: 180 } }
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ minWidth: { xs: '100%', md: 100 }, height: 56 }}
          >
            Search
          </Button>
          <TextField
            label="Sort By"
            name="sort"
            onChange={handleSortChange}
            select
            SelectProps={{ native: true }}
            value={`${sortBy}|${sortDir}`}
            sx={{ minWidth: { xs: '100%', md: 220 }, flexShrink: 0 }}
          >
            {sortOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </TextField>
        </Stack>
      </Box>
      <Divider />
      {showChips && (
        <Stack
          alignItems="center"
          direction="row"
          flexWrap="wrap"
          gap={1}
          sx={{ p: 2 }}
        >
          {chips.map((chip, index) => (
            <Chip
              key={index}
              label={
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    '& span': {
                      fontWeight: 600
                    }
                  }}
                >
                  <>
                    <span>{chip.label}</span>: {chip.displayValue || chip.value}
                  </>
                </Box>
              }
              onDelete={(): void => handleChipDelete(chip)}
              variant="outlined"
            />
          ))}
        </Stack>
      )}
      <Divider />
    </>
  );
};

BookingListSearch.propTypes = {
  onFiltersChange: PropTypes.func,
  onSortChange: PropTypes.func,
  sortBy: PropTypes.string,
  sortDir: PropTypes.oneOf<SortDir>(['asc', 'desc'])
};
