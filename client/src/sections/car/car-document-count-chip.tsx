import type { CarDocumentSection } from '@libs/types';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { fileApi } from 'src/api/files';

interface CarDocumentCountChipProps {
  carNumber: string;
  section: CarDocumentSection;
  startDate: string;
  // Bump this to re-count once already revealed (e.g. after the upload/view
  // dialog for this row closes, in case files were added or removed).
  refreshTrigger?: number;
}

// Fetches nothing until the user clicks "Show count" - each count opens a
// fresh FTP connection (measured 7-14s+ in this environment, see
// file-list.tsx), so counting every row automatically on page load doesn't
// scale once a car accumulates more than a couple of records per section.
export const CarDocumentCountChip: FC<CarDocumentCountChipProps> = (props) => {
  const { carNumber, section, startDate, refreshTrigger } = props;
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const fetchCount = useCallback(async () => {
    setLoading(true);
    try {
      const files = await fileApi.listCarFiles(carNumber, section, startDate);
      setCount(files.length);
    } finally {
      setLoading(false);
    }
  }, [carNumber, section, startDate]);

  // Only re-count on refresh once the user has already revealed the count for
  // this row - never trigger the first, eager fetch from here.
  useEffect(() => {
    if (revealed) {
      fetchCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  if (!startDate) {
    return (
      <Chip
        label="0 files"
        size="small"
        variant="outlined"
      />
    );
  }

  if (!revealed) {
    return (
      <Chip
        label="Show count"
        size="small"
        variant="outlined"
        clickable
        onClick={() => {
          setRevealed(true);
          fetchCount();
        }}
      />
    );
  }

  if (loading || count === null) {
    return (
      <CircularProgress
        size={14}
        sx={{ mx: 1.5 }}
      />
    );
  }

  return (
    <Chip
      label={`${count} file${count === 1 ? '' : 's'}`}
      size="small"
      color={count > 0 ? 'primary' : 'default'}
      variant={count > 0 ? 'filled' : 'outlined'}
    />
  );
};
