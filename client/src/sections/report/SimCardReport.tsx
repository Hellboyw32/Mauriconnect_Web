import type { SimCardReportRow } from '@libs/types';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  type GridColDef
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import * as React from 'react';

const columns: GridColDef[] = [
  {
    field: 'AgentName',
    headerName: 'Agent Name',
    width: 250,
    flex: 1
  },
  {
    field: 'SimCardCount',
    headerName: 'SimCard Count',
    type: 'number',
    width: 180
  }
];

const Toolbar = () => (
  <GridToolbarContainer>
    <div
      style={{
        fontSize: '20px',
        fontWeight: 'bold',
        padding: '16px',
        width: '100%'
      }}
    >
      SimCard Report
    </div>
    <GridToolbarExport />
  </GridToolbarContainer>
);

export default function SimCardReport({ rows }: { rows: SimCardReportRow[] }): any {
  return (
    <Box sx={{ width: '100%' }}>
      <div style={{ width: '99%' }}>
        <DataGrid
          getRowId={(row) => row.AgentName}
          columns={columns}
          rows={rows}
          slots={{
            toolbar: Toolbar
          }}
          autoHeight
          disableVirtualization
          sx={{
            boxShadow: 2,
            border: 2,
            borderColor: 'primary.light'
          }}
        />
      </div>
    </Box>
  );
}
