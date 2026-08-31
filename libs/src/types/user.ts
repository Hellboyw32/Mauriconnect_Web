export type UserType = 'Normal' | 'Admin';

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
