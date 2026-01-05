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
import type { FC } from 'react';
import { ChangeEvent, useCallback, useRef, useState } from 'react';
import { useUpdateEffect } from 'src/hooks/use-update-effect';
import { timestampToDate } from 'src/utils/date-locale';

type SortValue = 'CreatedOn|desc' | 'CreatedOn|asc';

interface SortOption {
  label: string;
  value: SortValue;
}

const sortOptions: SortOption[] = [
  {
    label: 'Created on (newest)',
    value: 'CreatedOn|desc'
  },
  {
    label: 'Created on (oldest)',
    value: 'CreatedOn|asc'
  }
];

type SortDir = 'asc' | 'desc';

interface SearchChip {
  label: string;
  field: 'customerName' | 'pickupDate' | 'dropoffDate';
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

export const BookingListSearch: FC<BookingListSearchProps> = (props) => {
  const { onFiltersChange, onSortChange, sortBy, sortDir, filters } = props;
  const queryRef = useRef<HTMLInputElement | null>(null);
  const [chips, setChips] = useState<SearchChip[]>([]);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [dropoffDate, setDropoffDate] = useState<Date | null>(null);

  // Reset fields when filters are cleared from parent
  useUpdateEffect(() => {
    if (!filters?.customerName && !filters?.pickupDate && !filters?.dropoffDate) {
      setChips([]);
      setPickupDate(null);
      setDropoffDate(null);
      if (queryRef.current) {
        queryRef.current.value = '';
      }
    }
  }, [filters]);

  const handleChipsUpdate = useCallback(() => {
    const filters: Filters = {
      customerName: undefined,
      pickupDate: undefined,
      dropoffDate: undefined
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

  const handleSearchClick = useCallback(
    (event?: any): void => {
      if (event) {
        event.preventDefault();
      }

      const customerName = queryRef.current?.value || '';
      const newChips: SearchChip[] = [];

      // Add customer name chip
      if (customerName) {
        newChips.push({
          label: 'Customer Name',
          field: 'customerName',
          value: customerName
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

  const showChips = chips.length > 0;

  return (
    <>
      <Stack
        alignItems="center"
        direction="row"
        flexWrap="wrap"
        spacing={3}
        sx={{ p: 3 }}
      >
        <Box
          component="form"
          onSubmit={handleSearchClick}
          sx={{ flexGrow: 1 }}
        >
          <OutlinedInput
            defaultValue=""
            fullWidth
            inputProps={{ ref: queryRef }}
            placeholder="Search by customer name"
            startAdornment={
              <InputAdornment position="start">
                <SvgIcon>
                  <SearchMdIcon />
                </SvgIcon>
              </InputAdornment>
            }
          />
        </Box>
        <Stack
          alignItems="center"
          direction="row"
          flexWrap="wrap"
          spacing={1}
          sx={{ p: 1 }}
        >
          <DatePicker
            format="dd/MM/yyyy"
            label="Pickup Date"
            onChange={handlePickupDateChange}
            value={pickupDate}
            slotProps={{
              actionBar: {
                actions: ['clear', 'accept']
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
              }
            }}
          />
          <Button
            onClick={handleSearchClick}
            variant="contained"
            sx={{ minWidth: 100, height: 56 }}
          >
            Search
          </Button>
        </Stack>
        <TextField
          label="Sort By"
          name="sort"
          onChange={handleSortChange}
          select
          SelectProps={{ native: true }}
          value={`${sortBy}|${sortDir}`}
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
