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
  DELETE_BOOKING = 'spRemoveBookingDetails'
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

export enum DELIVERY_USER_STORED_PROCEDURES {
  GET_DELIVERY_USERS = 'spGetDeliveryUsers'
}

export enum REPORT_STORED_PROCEDURES {
  GET_PICKUP_SCHEDULE_BY_DATE = 'spGetPickScheduleByDate',
  GET_DROPOFF_SCHEDULE_BY_DATE = 'spGetDropScheduleByDate'
}
