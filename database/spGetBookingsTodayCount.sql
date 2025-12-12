-- =============================================
-- Author:		Auto-generated
-- Create date: 2025-12-08
-- Description:	Get count of bookings created today
-- =============================================
CREATE PROCEDURE [dbo].[spGetBookingsTodayCount]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS BookingCount
    FROM Booking
    WHERE CAST(CreatedOn AS DATE) = CAST(GETDATE() AS DATE)
      AND IsActive = 1;
END
GO
