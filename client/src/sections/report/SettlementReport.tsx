import type { SettlementReportRow } from '@libs/types';
import { DataGrid, GridToolbarContainer, type GridColDef } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { format } from 'date-fns';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { reportApi } from 'src/api/report';
import { toLocalDate } from 'src/utils/local-date';

const columns: GridColDef<SettlementReportRow>[] = [
  { field: 'ClientName', headerName: 'Client Name', width: 260 },
  {
    field: 'DropOffDate',
    headerName: 'Drop Off Date',
    width: 160,
    valueGetter: ({ value }) => (value ? format(toLocalDate(value), 'dd MMM yyyy') : '')
  }
];

const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const Toolbar = ({ title, date }: { title: string; date: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    try {
      setIsDownloading(true);
      saveBlob(await reportApi.downloadSettlementReportExcel(date), `Settlement_Report_${date}.xlsx`);
    } catch (err) {
      toast.error(err.message || 'Failed to download the settlement report');
    } finally {
      setIsDownloading(false);
    }
  }, [date]);

  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 2 }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{title}</div>
      <Button
        variant="outlined"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? 'Downloading…' : 'Download Excel'}
      </Button>
    </GridToolbarContainer>
  );
};

export default function SettlementReport({
  rows,
  date
}: {
  rows: SettlementReportRow[];
  date: string;
}) {
  // e.g. "Settlement Report-2026-11-17", as printed on the sheet
  const title = `Settlement Report-${date}`;

  return (
    <Box sx={{ width: '100%' }}>
      <div style={{ width: '99%' }}>
        <DataGrid
          getRowId={(row) => row.BookingId}
          columns={columns}
          rows={rows}
          slots={{ toolbar: Toolbar }}
          slotProps={{ toolbar: { title, date } as object }}
          getRowHeight={() => 'auto'}
          autoHeight
          disableVirtualization
          sx={{
            boxShadow: 2,
            border: 2,
            borderColor: 'primary.light',
            '& .MuiDataGrid-cell': { py: 1 }
          }}
        />
      </div>
    </Box>
  );
}
