import type { Filters } from '@libs/types';
import Box from '@mui/material/Box';
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
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from 'react';
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
}

export const BookingListSearch: FC<BookingListSearchProps> = (props) => {
  const { onFiltersChange, onSortChange, sortBy, sortDir } = props;
  const queryRef = useRef<HTMLInputElement | null>(null);
  const [chips, setChips] = useState<SearchChip[]>([]);

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
  }, []);

  const handleQueryChange = useCallback((event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const value = queryRef.current?.value || '';

    setChips((prevChips) => {
      const found = prevChips.find((chip) => chip.field === 'customerName');

      if (found && value) {
        return prevChips.map((chip) => {
          if (chip.field === 'customerName') {
            return {
              ...chip,
              value: queryRef.current?.value || ''
            };
          }

          return chip;
        });
      }

      if (found && !value) {
        return prevChips.filter((chip) => chip.field !== 'customerName');
      }

      if (!found && value) {
        const chip: SearchChip = {
          label: 'Customer Name',
          field: 'customerName',
          value
        };

        return [...prevChips, chip];
      }

      return prevChips;
    });

    if (queryRef.current) {
      queryRef.current.value = '';
    }
  }, []);

  const handlePickupDateChange = useCallback((date: Date | null): void => {
    const value = timestampToDate(date!);
    setChips((prevChips) => {
      const newChips = prevChips.filter((chip) => {
        if (chip.field !== 'pickupDate') {
          return true;
        }
      });

      newChips.push({
        label: 'Pickup Date',
        field: 'pickupDate',
        value: new Date(date!),
        displayValue: value
      });

      return newChips;
    });
  }, []);

  const handleDropoffDateChange = useCallback((date: Date | null): void => {
    const value = timestampToDate(date!);
    setChips((prevChips) => {
      const newChips = prevChips.filter((chip) => {
        if (chip.field !== 'dropoffDate') {
          return true;
        }
      });

      newChips.push({
        label: 'Dropoff Date',
        field: 'dropoffDate',
        value: new Date(date!),
        displayValue: value
      });

      return newChips;
    });
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
          onSubmit={handleQueryChange}
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
            value={new Date()}
          />
          <DatePicker
            format="dd/MM/yyyy"
            label="Dropoff Date"
            onChange={handleDropoffDateChange}
            value={new Date()}
          />
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
