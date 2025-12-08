export enum BOOKING_STORED_PROCEDURES {
  GET_BOOKING_DETAILS_JSON = 'spGetSingleBookingDetailsJson',
  GET_BOOKINGS_DETAILS = 'spAllGetBookingDetails',
  GET_BOOKINGS_DETAILS_JSON = 'spGetAllBookingDetailsJson',
  CREATE_BOOKING = 'spAddBookingDetails',
  DELETE_BOOKING = 'spRemoveBookingDetails'
}

export enum CAR_CATEGORY_STORED_PROCEDURES {
  GET_CAR_CATEGORIES = 'spGetCarCategory'
}

export enum CAR_STORED_PROCEDURES {
  GET_CARS = 'spGetCars'
}

export enum DELIVERY_USER_STORED_PROCEDURES {
  GET_DELIVERY_USERS = 'spGetDeliveryUsers'
}

export enum REPORT_STORED_PROCEDURES {
  GET_PICKUP_SCHEDULE_BY_DATE = 'spGetPickScheduleByDate'
}
