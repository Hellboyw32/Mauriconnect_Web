import type { RoadTaxRenewalReportItem } from '@libs/types';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  type GridColDef
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import { timestampToDate } from 'src/utils/date-locale';

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: '#',
    width: 60,
    type: 'number',
    valueGetter: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
  },
  {
    field: 'CarNumber',
    headerName: 'Car Number',
    width: 160
  },
  {
    field: 'Model',
    headerName: 'Car Model',
    width: 160
  },
  {
    field: 'StartDate',
    headerName: 'Start Date',
    width: 130,
    valueGetter: ({ value }) => (value ? timestampToDate(value) : '')
  },
  {
    field: 'EndDate',
    headerName: 'End Date',
    width: 130,
    valueGetter: ({ value }) => (value ? timestampToDate(value) : '')
  }
];

const RoadTaxRenewalToolbar = () => (
  <GridToolbarContainer>
    <div
      style={{
        fontSize: '20px',
        fontWeight: 'bold',
        padding: '16px',
        width: '100%'
      }}
    >
      RoadTax ReNew
    </div>
    <GridToolbarExport />
  </GridToolbarContainer>
);

export default function RoadTaxRenewalReport({ items }: { items: RoadTaxRenewalReportItem[] }) {
  return (
    <Box sx={{ width: '100%' }}>
      <div style={{ width: '99%' }}>
        <DataGrid
          getRowId={(row) => `${row.CarNumber}-${row.EndDate}`}
          columns={columns}
          rows={items}
          slots={{
            toolbar: RoadTaxRenewalToolbar
          }}
          getRowHeight={() => 'auto'}
          autoHeight
          disableVirtualization
          sx={{
            boxShadow: 2,
            border: 2,
            borderColor: 'primary.light',
            '& .MuiDataGrid-cell': {
              py: 1
            },
            '& .MuiDataGrid-cell:hover': {
              color: 'primary.main'
            }
          }}
        />
      </div>
    </Box>
  );
}
