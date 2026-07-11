USE [CarBooking]
GO
/****** Object:  StoredProcedure [dbo].[spGetSingleBookingDetailsJson]    Script Date: 10/07/2026 22:48:07 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Create the stored procedure in the specified schema
ALTER PROCEDURE [dbo].[spGetSingleBookingDetailsJson]
    @bookingId int
-- add more stored procedure parameters here
AS
BEGIN
    -- body of the stored procedure
    SELECT TOP 1
        Booking.BookingId,
        Booking.CustomerName,
        Booking.ReferenceNo,
        Booking.ContactDetails,
        Booking.FlightNo,
        Booking.PickUpDate,
        Booking.DropOffDate,
        Booking.NumberOfDays,
        Booking.Price,
        Cars.CategoryId,
        Booking.SpecialRequest,
        Booking.LastModifiedUserId,
        Booking.LastModifiedTimeStamp,
        ISNULL(Booking.CreatedBy, '') 'CreatedBy',
        ISNULL(Booking.CreatedOn, '') 'CreatedOn',
        ISNULL(NoShow, 0) 'NoShow',
        ISNULL(Booking.uploadId,0) as uploadId,
        ISNULL(Booking.Mileage, 0) as Mileage,
        ISNULL(Booking.Insurance, 0) as Insurance,
        ISNULL(Booking.Currency, '') as Currency,
        ISNULL(Booking.POSMachine, '') as POSMachine,
        ISNULL(Booking.DropOffPlace, '') as DropOffPlace,
        ISNULL(Booking.PickupLocation, '') as PickupLocation,
        ISNULL(Booking.PaymentMethod, '') as PaymentMethod,
        ISNULL(Booking.IsGps, 0) as IsGps,
        ISNULL(Booking.IsCarSeat, 0) as IsCarSeat,
        ISNULL(Booking.IsBoosterSeat, 0) as IsBoosterSeat,
        ISNULL(Booking.DeliveryUser, '') as DeliveryUser,
        ISNULL(Booking.hasInsurance, 0) as hasInsurance, 
        ISNULL(Booking.InsuranceAmount,'')  as InsuranceAmount,
        ISNULL(Booking.SimCard,'')  as SimCard,
        ISNULL(CarInsurance.startDate,getDate()) as CarInsurance,
        ISNULL(RoadTax.startDate,getDate()) as RoadTax,
        ISNULL(Booking.FuelLevel,'') as FuelLevel,
        ISNULL(Booking.ContractNumber,'') as ContractNumber,

        JSON_QUERY(
          (
            SELECT TOP 1
              Cars.CarId,
              Cars.Model,
              Cars.CarNumber,
              Cars.Description,
              Cars.IsActive,
              Cars.SortOrder,
              Cars.LastModifiedTimeStamp,
              Cars.LastModifiedUserId,
              Cars.CurrentMileage,
              Cars.ServicingFrequency,
              Cars.LastServicedMileage,
              JSON_QUERY(
                  (
                      SELECT TOP 1 *
                      FROM CarCategory
                      WHERE Cars.CategoryId = CarCategory.CategoryId
                      FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                  )
              ) AS CarCategory
            FROM
              Cars
            WHERE
              Cars.CarId = Booking.CarId
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
          )
        ) AS Car
      FROM
        Booking
      INNER JOIN Cars
          ON Cars.CarId = Booking.CarId
      LEFT JOIN CarInsurance
          ON CarInsurance.CarId = Cars.CarId
      LEFT JOIN RoadTax
          ON RoadTax.CarId = Cars.CarId
      WHERE Booking.BookingId = @bookingId
      ORDER BY Booking.LastModifiedTimeStamp DESC
      FOR JSON PATH;
END
