-- =============================================
-- Author:		Auto-generated
-- Create date: 2025-12-08
-- Description:	Get most recently created bookings
-- =============================================
CREATE PROCEDURE [dbo].[spGetRecentBookings]
    @limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@limit)
        B.BookingId,
        B.CustomerName,
        B.ContactDetails,
        B.FlightNumber,
        B.PickUpDate,
        B.DropOffDate,
        B.NumberOfDays,
        B.Price,
        B.SpecialRequest,
        B.ReferenceNo,
        B.InsuranceAmount AS Insurance,
        B.Currency,
        B.PaymentMethod,
        B.IsGps,
        B.IsCarSeat,
        B.IsBoosterSeat,
        B.DropOffPlace,
        B.CreatedOn,
        B.CreatedBy,
        B.IsActive,
        JSON_QUERY((
            SELECT
                C.CarId,
                C.Model,
                C.CarNumber,
                C.Description,
                C.CurrentMileage,
                JSON_QUERY((
                    SELECT
                        CC.CategoryId,
                        CC.Category
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )) AS CarCategory
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM Booking B
    INNER JOIN Car C ON B.CarId = C.CarId
    INNER JOIN CarCategory CC ON C.CategoryId = CC.CategoryId
    WHERE B.IsActive = 1
    ORDER BY B.CreatedOn DESC;
END
GO
