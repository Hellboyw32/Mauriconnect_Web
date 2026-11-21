import type { SettlementReportRow } from '@libs/types';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  type GridColDef
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import { format } from 'date-fns';
import { toLocalDate } from 'src/utils/local-date';

// Same columns, in the same order, as the paper settlement sheet.
const columns: GridColDef<SettlementReportRow>[] = [
  { field: 'ClientName', headerName: 'Client Name', width: 220 },
  { field: 'CarNo', headerName: 'CarNo', width: 130 },
  { field: 'Model', headerName: 'Model', width: 140 },
  {
    field: 'DropOffDate',
    headerName: 'DropOffDate',
    width: 130,
    valueGetter: ({ value }) => (value ? format(toLocalDate(value), 'dd MMM yyyy') : '')
  },
  { field: 'DropOffTime', headerName: 'D.Off Time', width: 100 },
  { field: 'Amount', headerName: 'Amount', width: 120 },
  { field: 'PayMode', headerName: 'PayMode', width: 120 },
  { field: 'Agent', headerName: 'Agent', width: 120 },
  { field: 'Remarks', headerName: 'Remarks', flex: 1, minWidth: 140 }
];

const Toolbar = ({ title }: { title: string }) => (
  <GridToolbarContainer>
    <div
      style={{
        fontSize: '20px',
        fontWeight: 'bold',
        padding: '16px',
        width: '100%'
      }}
    >
      {title}
    </div>
    <GridToolbarExport />
  </GridToolbarContainer>
);

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
          slots={{
            toolbar: () => <Toolbar title={title} />
          }}
          slotProps={{
            toolbar: { csvOptions: { fileName: title } }
          }}
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
