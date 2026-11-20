import type {
  Module,
  ModulePermission,
  PermissionAction,
  ReportType,
  ReportTypePermission,
  User
} from '../types/user';

export const ALL_MODULES: Module[] = [
  'Scheduler',
  'Expenses',
  'Bookings',
  'Cars',
  'CarInsurance',
  'RoadTax',
  'FitnessCertificate',
  'Reports'
];

export const ALL_REPORT_TYPES: ReportType[] = [
  'DailySchedule',
  'Availability',
  'Settlement',
  'SimCard',
  'Insurance'
];

// Admins bypass the UserPermissions table entirely (see hasPermission below),
// but the client still wants something to render in a permissions matrix if
// an Admin's own user record is ever viewed - all-true reflects reality.
export const synthesizeAdminPermissions = (): ModulePermission[] =>
  ALL_MODULES.map((module) => ({
    module,
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    maxDaysBeforeToday: null,
    maxDaysAfterToday: null
  }));

export const synthesizeAdminReportTypes = (): ReportTypePermission[] =>
  ALL_REPORT_TYPES.map((reportType) => ({ reportType, isAllowed: true }));

type BooleanPermissionField = 'canView' | 'canCreate' | 'canEdit' | 'canDelete';

const ACTION_FIELD: Record<PermissionAction, BooleanPermissionField> = {
  View: 'canView',
  Create: 'canCreate',
  Edit: 'canEdit',
  Delete: 'canDelete'
};

// Shared by both the api (requirePermission middleware, reading JWT claims)
// and the client (PermissionGuard, nav filtering, action buttons) so the
// default-allow semantics can't drift between the two: Admins always pass,
// and a module with no explicit permission row is treated as allowed (see
// database/add_user_permissions.sql for why absence must mean allowed, not
// denied).
export const hasPermission = (
  user: Pick<User, 'userType' | 'permissions'> | null | undefined,
  module: Module,
  action: PermissionAction
): boolean => {
  if (!user) return false;
  if (user.userType === 'Admin') return true;

  const entry = user.permissions?.find((permission) => permission.module === module);
  if (!entry) return true;

  return entry[ACTION_FIELD[action]];
};

// Whether this user can run a specific report at all - independent of the
// Reports module's own View flag (checked separately via hasPermission).
export const canRunReport = (
  user: Pick<User, 'userType' | 'reportTypes'> | null | undefined,
  reportType: ReportType
): boolean => {
  if (!user) return false;
  if (user.userType === 'Admin') return true;

  const entry = user.reportTypes?.find((permission) => permission.reportType === reportType);
  if (!entry) return true;

  return entry.isAllowed;
};

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

// Checks a candidate report date against this user's rolling date window
// (Reports module's MaxDaysBeforeToday/MaxDaysAfterToday - see
// database/add_report_permissions.sql). `today` is injectable for tests;
// defaults to the real current date.
export const isDateWithinReportWindow = (
  user: Pick<User, 'userType' | 'permissions'> | null | undefined,
  date: Date,
  today: Date = new Date()
): boolean => {
  if (!user) return false;
  if (user.userType === 'Admin') return true;

  const reports = user.permissions?.find((permission) => permission.module === 'Reports');
  if (!reports) return true;

  const target = startOfDay(date);
  const anchor = startOfDay(today);

  if (reports.maxDaysBeforeToday != null) {
    const earliest = addDays(anchor, -reports.maxDaysBeforeToday);
    if (target < earliest) return false;
  }

  if (reports.maxDaysAfterToday != null) {
    const latest = addDays(anchor, reports.maxDaysAfterToday);
    if (target > latest) return false;
  }

  return true;
};

// Same window as isDateWithinReportWindow, expressed as actual bounds - lets
// the UI pass minDate/maxDate straight to a date picker instead of
// re-deriving them. null means unrestricted in that direction.
export const getReportDateBounds = (
  user: Pick<User, 'userType' | 'permissions'> | null | undefined,
  today: Date = new Date()
): { minDate: Date | null; maxDate: Date | null } => {
  if (!user || user.userType === 'Admin') {
    return { minDate: null, maxDate: null };
  }

  const reports = user.permissions?.find((permission) => permission.module === 'Reports');
  if (!reports) {
    return { minDate: null, maxDate: null };
  }

  const anchor = startOfDay(today);

  return {
    minDate: reports.maxDaysBeforeToday != null ? addDays(anchor, -reports.maxDaysBeforeToday) : null,
    maxDate: reports.maxDaysAfterToday != null ? addDays(anchor, reports.maxDaysAfterToday) : null
  };
};
