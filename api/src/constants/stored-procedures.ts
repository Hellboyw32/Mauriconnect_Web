export enum BOOKING_STORED_PROCEDURES {
  GET_BOOKING_DETAILS_JSON = 'spGetSingleBookingDetailsJson',
  GET_BOOKINGS_DETAILS = 'spAllGetBookingDetails',
  GET_BOOKINGS_DETAILS_JSON = 'spGetAllBookingDetailsJson',
  GET_BOOKINGS_TODAY_COUNT = 'spGetBookingsTodayCount',
  GET_DROPOFFS_TODAY_COUNT = 'spGetDropoffsTodayCount',
  GET_PICKUPS_TODAY_COUNT = 'spGetPickupsTodayCount',
  GET_RECENT_BOOKINGS = 'spGetRecentBookings',
  GET_BOOKINGS_CURRENT_WEEK = 'spGetBookingsCurrentWeek',
  CREATE_BOOKING = 'spAddBookingDetails',
  UPDATE_BOOKING = 'spUpdateBookingDetails',
  DELETE_BOOKING = 'spRemoveBookingDetails',
  GET_BOOKING_YEAR_BY_REFERENCE_NO = 'spGetBookingYearByReferenceNo'
}

export enum CAR_CATEGORY_STORED_PROCEDURES {
  GET_CAR_CATEGORIES = 'spGetCarCategory'
}

export enum CAR_STORED_PROCEDURES {
  GET_CARS = 'spGetCars',
  GET_CARS_JSON = 'spGetAllCarDetailsJson',
  GET_CAR_JSON = 'spGetSingleCarDetailsJson',
  UPDATE_CAR = 'spUpdateCarDetails',
  GET_TOP_RENTED_CARS = 'spGetTopRentedCars',
  GET_CAR_CATEGORY_DISTRIBUTION = 'spGetCarCategoryDistribution'
}

export enum CAR_INSURANCE_STORED_PROCEDURES {
  GET_CAR_INSURANCES_JSON = 'spGetAllCarInsuranceJson',
  GET_CAR_INSURANCE_JSON = 'spGetSingleCarInsuranceJson',
  UPDATE_CAR_INSURANCE = 'spUpdateCarInsuranceDetails',
  DELETE_CAR_INSURANCE = 'spDeleteCarInsurance'
}

export enum ROAD_TAX_STORED_PROCEDURES {
  GET_ROAD_TAXES_JSON = 'spGetAllRoadTaxJson',
  GET_ROAD_TAX_JSON = 'spGetSingleRoadTaxJson',
  UPDATE_ROAD_TAX = 'spUpdateRoadTaxDetails',
  DELETE_ROAD_TAX = 'spDeleteRoadTax'
}

export enum FITNESS_CERTIFICATE_STORED_PROCEDURES {
  GET_FITNESS_CERTIFICATES_JSON = 'spGetAllFitnessCertificateJson',
  GET_FITNESS_CERTIFICATE_JSON = 'spGetSingleFitnessCertificateJson',
  UPDATE_FITNESS_CERTIFICATE = 'spUpdateFitnessCertificateDetails',
  DELETE_FITNESS_CERTIFICATE = 'spDeleteFitnessCertificate'
}

export enum DELIVERY_USER_STORED_PROCEDURES {
  GET_DELIVERY_USERS = 'spGetDeliveryUsers'
}

export enum USER_STORED_PROCEDURES {
  GET_USERS_JSON = 'spGetAllUsersJson',
  GET_USER_JSON = 'spGetSingleUserJson',
  GET_USER_FOR_LOGIN_JSON = 'spGetUserForLoginJson',
  CHECK_USERNAME_EXISTS = 'spCheckUsernameExists',
  UPDATE_USER = 'spUpdateUserDetails',
  LOCK_UNLOCK_USER = 'spLockUnlockUser',
  CHANGE_USER_PASSWORD = 'spChangeUserPassword',
  RECORD_LOGIN_SUCCESS = 'spRecordLoginSuccess',
  RECORD_LOGIN_FAILURE = 'spRecordLoginFailure',
  RECORD_LOGOUT = 'spRecordLogout',
  GET_USER_LOGIN_LOGS_JSON = 'spGetUserLoginLogsJson',
  GET_USER_ANALYTICS = 'spGetUserAnalytics',
  GET_LOGIN_ANALYTICS = 'spGetLoginAnalytics',
  GET_USER_PERMISSIONS_JSON = 'spGetUserPermissionsJson',
  UPSERT_USER_PERMISSION = 'spUpsertUserPermission',
  GET_USER_REPORT_PERMISSIONS_JSON = 'spGetUserReportPermissionsJson',
  UPSERT_USER_REPORT_PERMISSION = 'spUpsertUserReportPermission'
}

export enum AUDIT_LOG_STORED_PROCEDURES {
  INSERT_AUDIT_LOG = 'spInsertAuditLog',
  GET_AUDIT_LOGS_JSON = 'spGetAuditLogsJson'
}

export enum REPORT_STORED_PROCEDURES {
  GET_PICKUP_SCHEDULE_BY_DATE = 'spGetPickScheduleByDate',
  GET_DROPOFF_SCHEDULE_BY_DATE = 'spGetDropScheduleByDate',
  GET_SIM_CARD_REPORT = 'spGetSimCardReportByDate',
  GET_INSURANCE_REPORT = 'spGetInsuranceReportByDate'
}
