export interface UserLoginLog {
  Id: number;
  UserId?: number | null;
  Username: string;
  LoginTimeStamp: string;
  LogoutTimeStamp?: string | null;
  LoginSuccessful: boolean;
  FailureReason?: string | null;
  IPAddress?: string | null;
  UserAgent?: string | null;
}

export type UserLoginLogs = UserLoginLog[];

export interface UserLoginLogFilters {
  username?: string;
  fromDate?: Date;
  toDate?: Date;
  loginSuccessful?: boolean | '';
}
