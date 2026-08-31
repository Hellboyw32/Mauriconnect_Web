export interface UserAnalytics {
  TotalUsers: number;
  ActiveUsers: number;
  InactiveUsers: number;
  LockedUsers: number;
  NormalUsers: number;
  AdminUsers: number;
}

export interface LoginAnalytics {
  SuccessfulLoginsToday: number;
  FailedLoginsToday: number;
  SuccessfulLoginsThisWeek: number;
  FailedLoginsThisWeek: number;
}
