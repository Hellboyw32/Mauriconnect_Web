import type { FitnessCertificateFilters } from '@libs/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import SearchMdIcon from '@untitled-ui/icons-react/build/esm/SearchMd';
import type { FC, FormEvent } from 'react';
import { type ChangeEvent, useCallback, useRef, useState } from 'react';
import { useUpdateEffect } from 'src/hooks/use-update-effect';

type SortValue =
  | 'CarNumber|asc'
  | 'CarNumber|desc'
  | 'Model|asc'
  | 'Model|desc'
  | 'StartDate|asc'
  | 'StartDate|desc'
  | 'EndDate|asc'
  | 'EndDate|desc';

interface SortOption {
  label: string;
  value: SortValue;
}

const sortOptions: SortOption[] = [
  { label: 'Car Number (A-Z)', value: 'CarNumber|asc' },
  { label: 'Car Number (Z-A)', value: 'CarNumber|desc' },
  { label: 'Model (A-Z)', value: 'Model|asc' },
  { label: 'Model (Z-A)', value: 'Model|desc' },
  { label: 'Start Date (newest)', value: 'StartDate|desc' },
  { label: 'Start Date (oldest)', value: 'StartDate|asc' },
  { label: 'End Date (newest)', value: 'EndDate|desc' },
  { label: 'End Date (oldest)', value: 'EndDate|asc' }
];

type SortDir = 'asc' | 'desc';

interface SearchChip {
  label: string;
  field: 'carNumber';
  value: unknown;
  displayValue?: unknown;
}

interface FitnessCertificateListSearchProps {
  onFiltersChange?: (filters: FitnessCertificateFilters) => void;
  onSortChange?: (sort: { sortBy: string; sortDir: SortDir }) => void;
  sortBy?: string;
  sortDir?: SortDir;
  filters?: FitnessCertificateFilters;
}

export const FitnessCertificateListSearch: FC<FitnessCertificateListSearchProps> = (props) => {
  const { onFiltersChange, onSortChange, sortBy, sortDir, filters } = props;
  const queryRef = useRef<HTMLInputElement | null>(null);
  const [chips, setChips] = useState<SearchChip[]>([]);

  // Reset fields when filters are cleared from parent
  useUpdateEffect(() => {
    if (!filters?.carNumber) {
      setChips((prevChips) => (prevChips.length > 0 ? [] : prevChips));
      if (queryRef.current) {
        queryRef.current.value = '';
      }
    }
  }, [filters]);

  const handleChipsUpdate = useCallback(() => {
    const filters: FitnessCertificateFilters = {
      carNumber: undefined
    };

    chips.forEach((chip) => {
      if (chip.field === 'carNumber') {
        filters.carNumber = chip.value as string;
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
      const found = prevChips.find((chip) => chip.field === 'carNumber');

      if (found && value) {
        return prevChips.map((chip) => {
          if (chip.field === 'carNumber') {
            return { ...chip, value: queryRef.current?.value || '' };
          }
          return chip;
        });
      }

      if (found && !value) {
        return prevChips.filter((chip) => chip.field !== 'carNumber');
      }

      if (!found && value) {
        const chip: SearchChip = { label: 'Car Number', field: 'carNumber', value };
        return [...prevChips, chip];
      }

      return prevChips;
    });
  }, []);

  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const [newSortBy, newSortDir] = event.target.value.split('|') as [string, SortDir];

      onSortChange?.({
        sortBy: newSortBy,
        sortDir: newSortDir
      });
    },
    [onSortChange]
  );

  return (
    <>
      <Stack
        alignItems="center"
        component="form"
        direction="row"
        onSubmit={handleQueryChange}
        spacing={2}
        sx={{ p: 2 }}
      >
        <OutlinedInput
          defaultValue=""
          fullWidth
          inputProps={{ ref: queryRef }}
          placeholder="Search by car number"
          startAdornment={
            <InputAdornment position="start">
              <SvgIcon>
                <SearchMdIcon />
              </SvgIcon>
            </InputAdornment>
          }
        />
        <Button
          type="submit"
          variant="contained"
          sx={{ minWidth: 100, height: 56 }}
        >
          Search
        </Button>
        <TextField
          label="Sort By"
          name="sort"
          onChange={handleSortChange}
          select
          SelectProps={{ native: false }}
          value={`${sortBy}|${sortDir}`}
          sx={{ width: 250 }}
        >
          {sortOptions.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Divider />
      {chips.length > 0 && (
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
              onDelete={() => handleChipDelete(chip)}
              variant="outlined"
            />
          ))}
        </Stack>
      )}
    </>
  );
};
