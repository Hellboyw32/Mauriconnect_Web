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

export enum SERVICING_STORED_PROCEDURES {
  ADD_SERVICING_RECORD = 'spAddServicingRecord',
  GET_SERVICING_HISTORY_JSON = 'spGetServicingHistoryJson',
  GET_SINGLE_SERVICING_RECORD_JSON = 'spGetSingleServicingRecordJson',
  UPDATE_SERVICING_RECORD = 'spUpdateServicingRecord'
}

export enum REPORT_STORED_PROCEDURES {
  GET_PICKUP_SCHEDULE_BY_DATE = 'spGetPickScheduleByDate',
  GET_DROPOFF_SCHEDULE_BY_DATE = 'spGetDropScheduleByDate',
  GET_SIM_CARD_REPORT = 'spGetSimCardReportByDate',
  GET_INSURANCE_REPORT = 'spGetInsuranceReportByDate'
}
