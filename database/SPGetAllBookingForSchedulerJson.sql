USE [CarBooking]
GO

-- JSON version of SPGetAllBookingForScheduler, limited to a date window so the
-- dashboard scheduler doesn't pull every booking. Defaults: 5 months back to
-- 7 months ahead of today. A booking is included if it overlaps the window.
CREATE OR ALTER PROCEDURE [dbo].[SPGetAllBookingForSchedulerJson]
    @MonthsBack INT = 5,
    @MonthsForward INT = 7
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FromDate DATETIME = DATEADD(MONTH, -@MonthsBack, CAST(GETDATE() AS DATE));
    DECLARE @ToDate DATETIME = DATEADD(MONTH, @MonthsForward, CAST(GETDATE() AS DATE));

    SELECT
        b.BookingId,
        b.CustomerName,
        b.ReferenceNo,
        b.ContactDetails,
        b.FlightNo,
        b.PickUpDate,
        b.DropOffDate,
        b.NumberOfDays,
        b.Price,
        b.Currency,
        b.CarId,
        c.CategoryId,
        b.SpecialRequest,
        b.NoShow
    FROM dbo.Booking b
    INNER JOIN dbo.Cars c ON c.CarId = b.CarId
    WHERE b.IsActive = 1
      AND c.CarNumber NOT LIKE '%Outsource%'
      AND c.CarNumber NOT LIKE '%NO-SHOW%'
      AND b.PickUpDate <= @ToDate
      AND b.DropOffDate >= @FromDate
    ORDER BY b.PickUpDate
    FOR JSON PATH;
END
GO
