export type UserType = 'Normal' | 'Admin';

// Modules that can be individually gated for Normal users. Dashboard/Overview
// and the dashboard's own Analytics page are intentionally excluded - they're
// the post-login landing page and are always visible to any authenticated user.
export type Module =
  | 'Scheduler'
  | 'Expenses'
  | 'Bookings'
  | 'Cars'
  | 'CarInsurance'
  | 'RoadTax'
  | 'FitnessCertificate'
  | 'Reports';

export type PermissionAction = 'View' | 'Create' | 'Edit' | 'Delete';

export interface ModulePermission {
  module: Module;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  // Reports-only: how many days before/after today this user may set as a
  // report's start/end date. null/undefined = unrestricted in that
  // direction (default-allow, see database/add_report_permissions.sql).
  // Meaningless for every other module.
  maxDaysBeforeToday?: number | null;
  maxDaysAfterToday?: number | null;
}

// Matches the column casing spGetUserForLoginJson/spGetSingleUserJson return
// straight off the DB (see database/spGetUserPermissionsJson.sql) - distinct
// from ModulePermission, which is the camelCase shape used everywhere else.
export interface RawModulePermission {
  Module: string;
  CanView: boolean;
  CanCreate: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
  MaxDaysBeforeToday?: number | null;
  MaxDaysAfterToday?: number | null;
}

// The individual reports selectable from the Reports screen's dropdown
// (client/src/pages/reports/reportsLandingPage.tsx). Availability/Settlement
// are listed there but not yet implemented server-side - included here so
// the permission catalog doesn't need revisiting once they are.
export type ReportType = 'DailySchedule' | 'Availability' | 'Settlement' | 'SimCard' | 'Insurance';

export interface ReportTypePermission {
  reportType: ReportType;
  isAllowed: boolean;
}

export interface RawReportTypePermission {
  ReportType: string;
  IsAllowed: boolean;
}

// The authenticated identity kept in auth context / sessionStorage, returned
// by /auth/login and /auth/me. Never carries the password hash.
export interface User {
  userId: number;
  username: string;
  emailAccount: string;
  userType: UserType;
  isAccountLocked: boolean;
  lastLoggedIn?: string | null;
  avatar?: string;
  // Absent/missing entries mean "allowed" (default-allow model, see
  // database/add_user_permissions.sql) - always check via a helper that
  // falls back to true rather than indexing this array directly.
  permissions?: ModulePermission[];
  // Which specific reports this user can run - same default-allow rule.
  reportTypes?: ReportTypePermission[];

  [key: string]: any;
}

// The richer shape used by the admin-only User Management screens.
export interface ManagedUser {
  UserId: number;
  Username: string;
  EmailAccount: string;
  UserType: UserType;
  IsAccountLocked: boolean;
  IsActive: boolean;
  FailedLoginAttempts: number;
  LastFailedLogin?: string | null;
  LastLoggedIn?: string | null;
  PasswordChangedAt?: string | null;
  CreatedUserId?: number | null;
  CreatedByUsername?: string | null;
  CreatedTimeStamp?: string | null;
  LastModifiedUserId?: number | null;
  LastModifiedByUsername?: string | null;
  LastModifiedTimeStamp?: string | null;
  Permissions?: RawModulePermission[] | null;
  ReportTypes?: RawReportTypePermission[] | null;
}

export type ManagedUsers = ManagedUser[];

export interface UserFormValues {
  UserId?: number;
  Username: string;
  EmailAccount: string;
  Password?: string;
  ConfirmPassword?: string;
  UserType: UserType;
  IsActive: boolean;
  IsAccountLocked: boolean;
  Permissions?: ModulePermission[];
  ReportTypes?: ReportTypePermission[];
}

export interface UserFilters {
  username?: string;
  userType?: UserType | '';
  status?: 'Active' | 'Inactive' | 'Locked' | '';
}

export interface UsersSearchState {
  filters: UserFilters;
  page: number;
  rowsPerPage: number;
}
