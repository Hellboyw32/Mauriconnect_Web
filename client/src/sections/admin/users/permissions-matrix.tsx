import { ALL_MODULES, ALL_REPORT_TYPES } from '@libs/permissions';
import type {
  Module,
  ModulePermission,
  PermissionAction,
  ReportType,
  ReportTypePermission
} from '@libs/types';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ChevronDownIcon from '@untitled-ui/icons-react/build/esm/ChevronDown';
import ChevronRightIcon from '@untitled-ui/icons-react/build/esm/ChevronRight';
import type { FC } from 'react';
import { Fragment, useState } from 'react';

interface PermissionsMatrixProps {
  value: ModulePermission[];
  onChange: (permissions: ModulePermission[]) => void;
  reportTypes: ReportTypePermission[];
  onReportTypesChange: (reportTypes: ReportTypePermission[]) => void;
}

const MODULE_LABELS: Record<Module, string> = {
  Scheduler: 'Scheduler',
  Expenses: 'Expenses',
  Bookings: 'Bookings',
  Cars: 'Cars',
  CarInsurance: 'Car Insurance',
  RoadTax: 'Road Tax',
  FitnessCertificate: 'Fitness Certificate',
  Reports: 'Reports'
};

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  DailySchedule: 'Daily Schedule Report',
  Availability: 'Availability Report',
  Settlement: 'Settlement Report',
  SimCard: 'SimCard Report',
  Insurance: 'Insurance Report'
};

// Reports and Scheduler have no create/edit/delete concept - they're read-only screens.
const VIEW_ONLY_MODULES: Module[] = ['Reports', 'Scheduler'];

const ACTIONS: { action: PermissionAction; field: keyof Omit<ModulePermission, 'module'> }[] = [
  { action: 'View', field: 'canView' },
  { action: 'Create', field: 'canCreate' },
  { action: 'Edit', field: 'canEdit' },
  { action: 'Delete', field: 'canDelete' }
];

export const PermissionsMatrix: FC<PermissionsMatrixProps> = (props) => {
  const { value, onChange, reportTypes, onReportTypesChange } = props;
  const [reportsExpanded, setReportsExpanded] = useState(false);

  const getRow = (module: Module): ModulePermission =>
    value.find((permission) => permission.module === module) ?? {
      module,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      maxDaysBeforeToday: null,
      maxDaysAfterToday: null
    };

  const handleToggle = (module: Module, field: keyof Omit<ModulePermission, 'module'>) => {
    const current = getRow(module);
    const updated: ModulePermission = { ...current, [field]: !current[field] };
    const next = value.some((permission) => permission.module === module)
      ? value.map((permission) => (permission.module === module ? updated : permission))
      : [...value, updated];

    onChange(next);
  };

  const handleDayWindowChange = (
    field: 'maxDaysBeforeToday' | 'maxDaysAfterToday',
    rawValue: string
  ) => {
    const parsed = rawValue.trim() === '' ? null : Math.max(0, parseInt(rawValue, 10) || 0);
    const current = getRow('Reports');
    const updated: ModulePermission = { ...current, [field]: parsed };
    const next = value.some((permission) => permission.module === 'Reports')
      ? value.map((permission) => (permission.module === 'Reports' ? updated : permission))
      : [...value, updated];

    onChange(next);
  };

  const getReportTypeRow = (reportType: ReportType): ReportTypePermission =>
    reportTypes.find((entry) => entry.reportType === reportType) ?? { reportType, isAllowed: true };

  const handleReportTypeToggle = (reportType: ReportType) => {
    const current = getReportTypeRow(reportType);
    const updated: ReportTypePermission = { ...current, isAllowed: !current.isAllowed };
    const next = reportTypes.some((entry) => entry.reportType === reportType)
      ? reportTypes.map((entry) => (entry.reportType === reportType ? updated : entry))
      : [...reportTypes, updated];

    onReportTypesChange(next);
  };

  const reportsRow = getRow('Reports');

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell />
          <TableCell>Module</TableCell>
          {ACTIONS.map(({ action }) => (
            <TableCell
              key={action}
              align="center"
            >
              {action}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {ALL_MODULES.map((module) => {
          const row = getRow(module);
          const isReports = module === 'Reports';

          return (
            <Fragment key={module}>
              <TableRow>
                <TableCell sx={{ width: 40 }}>
                  {isReports && (
                    <IconButton
                      size="small"
                      onClick={() => setReportsExpanded((prev) => !prev)}
                    >
                      <SvgIcon fontSize="small">
                        {reportsExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </SvgIcon>
                    </IconButton>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{MODULE_LABELS[module]}</Typography>
                </TableCell>
                {ACTIONS.map(({ action, field }) => (
                  <TableCell
                    key={action}
                    align="center"
                  >
                    <Checkbox
                      size="small"
                      checked={row[field] as boolean}
                      disabled={VIEW_ONLY_MODULES.includes(module) && field !== 'canView'}
                      onChange={() => handleToggle(module, field)}
                    />
                  </TableCell>
                ))}
              </TableRow>
              {isReports && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    sx={{ py: 0, borderBottom: reportsExpanded ? undefined : 'none' }}
                  >
                    <Collapse in={reportsExpanded}>
                      <Stack
                        spacing={2}
                        sx={{ py: 2, px: 1 }}
                      >
                        <Stack spacing={1}>
                          <Typography variant="subtitle2">Which reports can they run?</Typography>
                          <Stack
                            direction="row"
                            flexWrap="wrap"
                            spacing={0}
                          >
                            {ALL_REPORT_TYPES.map((reportType) => (
                              <FormControlLabel
                                key={reportType}
                                sx={{ minWidth: 220 }}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={getReportTypeRow(reportType).isAllowed}
                                    onChange={() => handleReportTypeToggle(reportType)}
                                  />
                                }
                                label={
                                  <Typography variant="body2">
                                    {REPORT_TYPE_LABELS[reportType]}
                                  </Typography>
                                }
                              />
                            ))}
                          </Stack>
                        </Stack>

                        <Stack spacing={1}>
                          <Typography variant="subtitle2">
                            How far back/forward can they query?
                          </Typography>
                          <Typography
                            color="text.secondary"
                            variant="caption"
                          >
                            Leave blank for no limit. Measured from today, so it never needs
                            updating.
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={2}
                          >
                            <TextField
                              type="number"
                              size="small"
                              label="Max days before today (Start Date)"
                              inputProps={{ min: 0 }}
                              value={reportsRow.maxDaysBeforeToday ?? ''}
                              onChange={(event) =>
                                handleDayWindowChange('maxDaysBeforeToday', event.target.value)
                              }
                              sx={{ minWidth: 260 }}
                            />
                            <TextField
                              type="number"
                              size="small"
                              label="Max days after today (End Date)"
                              inputProps={{ min: 0 }}
                              value={reportsRow.maxDaysAfterToday ?? ''}
                              onChange={(event) =>
                                handleDayWindowChange('maxDaysAfterToday', event.target.value)
                              }
                              sx={{ minWidth: 260 }}
                            />
                          </Stack>
                        </Stack>
                      </Stack>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};
