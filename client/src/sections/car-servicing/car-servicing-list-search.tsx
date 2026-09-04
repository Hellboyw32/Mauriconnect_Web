import type { ServicingFilters } from '@libs/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import SearchMdIcon from '@untitled-ui/icons-react/build/esm/SearchMd';
import type { FC, FormEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useUpdateEffect } from 'src/hooks/use-update-effect';

interface SearchChip {
  label: string;
  field: 'carNumber';
  value: unknown;
}

interface CarServicingListSearchProps {
  onFiltersChange?: (filters: ServicingFilters) => void;
  filters?: ServicingFilters;
}

export const CarServicingListSearch: FC<CarServicingListSearchProps> = (props) => {
  const { onFiltersChange, filters } = props;
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
    const filters: ServicingFilters = {
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
    setChips((prevChips) => prevChips.filter((chip) => chip.field !== deletedChip.field));
  }, []);

  const handleQuerySubmit = useCallback((event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const value = queryRef.current?.value || '';

    setChips(value ? [{ label: 'Car Number', field: 'carNumber', value }] : []);
  }, []);

  return (
    <>
      <Stack
        alignItems="center"
        component="form"
        direction="row"
        onSubmit={handleQuerySubmit}
        spacing={2}
        sx={{ p: 2 }}
      >
        <OutlinedInput
          defaultValue=""
          fullWidth
          inputProps={{ ref: queryRef }}
          placeholder="Search by car registration number"
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
                    <span>{chip.label}</span>: {chip.value as string}
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
