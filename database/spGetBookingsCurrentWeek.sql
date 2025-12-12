-- =============================================
-- Author:		Auto-generated
-- Create date: 2025-12-11
-- Description:	Get daily booking counts for the current week (Sunday to Saturday)
-- =============================================
CREATE PROCEDURE [dbo].[spGetBookingsCurrentWeek]
AS
BEGIN
    SET NOCOUNT ON;

    -- Get the start of the current week (Sunday)
    DECLARE @WeekStart DATE = DATEADD(DAY, 1 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE));
    DECLARE @WeekEnd DATE = DATEADD(DAY, 6, @WeekStart);

    -- Create a result set with all days of the week and their booking counts
    SELECT 
        DATENAME(WEEKDAY, d.Date) AS DayName,
        DATEPART(WEEKDAY, d.Date) AS DayOfWeek,
        d.Date,
        ISNULL(COUNT(B.BookingId), 0) AS BookingCount
    FROM (
        -- Generate all 7 days of the current week
        SELECT DATEADD(DAY, number, @WeekStart) AS Date
        FROM master..spt_values
        WHERE type = 'P' AND number BETWEEN 0 AND 6
    ) d
    LEFT JOIN Booking B ON CAST(B.CreatedOn AS DATE) = d.Date AND B.IsActive = 1
    GROUP BY d.Date
    ORDER BY d.Date;
END
GO
