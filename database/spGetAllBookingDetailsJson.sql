USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetAllBookingDetailsJson]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingId,
        b.CustomerName,
        b.ContactDetails,
        b.PickUpDate,
        b.DropOffDate,
        b.NumberOfDays,
        b.Price,
        b.Currency,
        b.FlightNumber,
        b.SpecialRequest,
        b.IsBoosterSeat,
        b.IsCarSeat,
        b.IsGps,
        b.HasInsurance,
        b.FuelLevel,
        b.DropOffPlace,
        b.ReferenceNo,
        b.CreatedOn,
        b.LastModifiedOn,
        b.IsActive,
        c.CarId,
        c.Model,
        c.CarNumber,
        c.Description,
        c.CurrentMileage,
        c.ServicingFrequency,
        c.LastServicedMileage,
        cc.CategoryId,
        cc.Category,
        cc.Description AS CategoryDescription,
        du.DeliveryUserId,
        du.Name AS DeliveryUserName
    FROM 
        Booking b
        INNER JOIN Cars c ON b.CarId = c.CarId
        LEFT JOIN CarCategory cc ON c.CategoryId = cc.CategoryId
        LEFT JOIN DeliveryUsers du ON b.DeliveryUser = du.DeliveryUserId
    WHERE 
        b.IsActive = 1
    ORDER BY 
        b.CreatedOn DESC;
END
GO
