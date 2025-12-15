import type { CarFilters } from '@libs/types';
import { CarCategoryOptions } from '@libs/types';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import SearchMdIcon from '@untitled-ui/icons-react/build/esm/SearchMd';
import type { FC } from 'react';
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from 'react';
import { useUpdateEffect } from 'src/hooks/use-update-effect';

type SortValue = 'CarNumber|asc' | 'CarNumber|desc' | 'Model|asc' | 'Model|desc';

interface SortOption {
  label: string;
  value: SortValue;
}

const sortOptions: SortOption[] = [
  {
    label: 'Car Number (A-Z)',
    value: 'CarNumber|asc'
  },
  {
    label: 'Car Number (Z-A)',
    value: 'CarNumber|desc'
  },
  {
    label: 'Model (A-Z)',
    value: 'Model|asc'
  },
  {
    label: 'Model (Z-A)',
    value: 'Model|desc'
  }
];

const carCategories = [
  { value: '', label: 'All Categories' },
  { value: CarCategoryOptions.Mini, label: 'Mini' },
  { value: CarCategoryOptions.Economy, label: 'Economy' },
  { value: CarCategoryOptions.Intermediate, label: 'Intermediate' },
  { value: CarCategoryOptions.Fullsize, label: 'Fullsize' }
];

type SortDir = 'asc' | 'desc';

interface SearchChip {
  label: string;
  field: 'carNumber' | 'categoryId';
  value: unknown;
  displayValue?: unknown;
}

interface CarListSearchProps {
  onFiltersChange?: (filters: CarFilters) => void;
  onSortChange?: (sort: { sortBy: string; sortDir: SortDir }) => void;
  sortBy?: string;
  sortDir?: SortDir;
}

export const CarListSearch: FC<CarListSearchProps> = (props) => {
  const { onFiltersChange, onSortChange, sortBy, sortDir } = props;
  const queryRef = useRef<HTMLInputElement | null>(null);
  const [chips, setChips] = useState<SearchChip[]>([]);

  const handleChipsUpdate = useCallback(() => {
    const filters: CarFilters = {
      carNumber: undefined,
      categoryId: undefined
    };

    chips.forEach((chip) => {
      switch (chip.field) {
        case 'carNumber':
          filters.carNumber = chip.value as string;
          break;
        case 'categoryId':
          filters.categoryId = chip.value as number;
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
      const found = prevChips.find((chip) => chip.field === 'carNumber');

      if (found && value) {
        return prevChips.map((chip) => {
          if (chip.field === 'carNumber') {
            return {
              ...chip,
              value: queryRef.current?.value || ''
            };
          }

          return chip;
        });
      }

      if (found && !value) {
        return prevChips.filter((chip) => chip.field !== 'carNumber');
      }

      if (!found && value) {
        const chip: SearchChip = {
          label: 'Car Number',
          field: 'carNumber',
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

  const handleCategoryChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;

    setChips((prevChips) => {
      const newChips = prevChips.filter((chip) => chip.field !== 'categoryId');

      if (value) {
        const categoryLabel = carCategories.find((c) => c.value === Number(value))?.label || value;
        newChips.push({
          label: 'Category',
          field: 'categoryId',
          value: Number(value),
          displayValue: categoryLabel
        });
      }

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
        <TextField
          label="Category"
          name="category"
          onChange={handleCategoryChange}
          select
          SelectProps={{ native: false }}
          sx={{ width: 250 }}
        >
          {carCategories.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </MenuItem>
          ))}
        </TextField>
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
