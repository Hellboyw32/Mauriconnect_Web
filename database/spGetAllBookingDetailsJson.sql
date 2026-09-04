USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetAllBookingDetailsJson]
    @CustomerName NVARCHAR(255) = NULL,
    @PickupDate DATETIME = NULL,
    @DropoffDate DATETIME = NULL,
    @ReferenceNo NVARCHAR(255) = NULL,
    @CarNumber NVARCHAR(255) = NULL,
    @TopCount INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@TopCount)
        b.BookingId,
        b.CustomerName,
        b.ContractNumber,
        b.ContactDetails,
        b.FlightNumber,
        b.PickUpDate,
        b.DropOffDate,
        b.NumberOfDays,
        b.Price,
        b.Currency,
        b.SpecialRequest,
        b.IsBoosterSeat,
        b.IsCarSeat,
        b.IsGps,
        b.HasInsurance,
        b.InsuranceAmount AS Insurance,
        b.PaymentMethod,
        b.FuelLevel,
        b.DropOffPlace,
        b.PickupLocation,
        b.ReferenceNo,
        b.CreatedOn,
        b.CreatedBy,
        b.LastModifiedTimeStamp,
        b.IsActive,
        b.DeliveryUser,
        JSON_QUERY((
            SELECT
                c.CarId,
                c.Model,
                c.CarNumber,
                c.Description,
                c.CurrentMileage,
                c.ServicingFrequency,
                c.LastServicedMileage,
                JSON_QUERY((
                    SELECT
                        cc.CategoryId,
                        cc.Category,
                        cc.Description
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS CarCategory
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM 
        Booking b
        INNER JOIN Cars c ON b.CarId = c.CarId
        LEFT JOIN CarCategory cc ON c.CategoryId = cc.CategoryId
        LEFT JOIN DeliveryUsers du ON b.DeliveryUser = du.DeliveryUserId
    WHERE 
        b.IsActive = 1
        AND (@CustomerName IS NULL OR b.CustomerName LIKE '%' + @CustomerName + '%')
        AND (@PickupDate IS NULL OR CAST(b.PickUpDate AS DATE) = CAST(@PickupDate AS DATE))
        AND (@DropoffDate IS NULL OR CAST(b.DropOffDate AS DATE) = CAST(@DropoffDate AS DATE))
        AND (@ReferenceNo IS NULL OR b.ReferenceNo LIKE '%' + @ReferenceNo + '%')
        AND (@CarNumber IS NULL OR c.CarNumber LIKE '%' + @CarNumber + '%')
    ORDER BY
        b.LastModifiedTimeStamp DESC
    FOR JSON PATH;
END
GO
