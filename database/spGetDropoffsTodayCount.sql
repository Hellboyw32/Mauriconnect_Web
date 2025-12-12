-- =============================================
-- Author:		Auto-generated
-- Create date: 2025-12-08
-- Description:	Get count of cars with drop-off date today
-- =============================================
CREATE PROCEDURE [dbo].[spGetDropoffsTodayCount]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TodayStart DATETIME = CAST(GETDATE() AS DATE);
    DECLARE @TodayEnd DATETIME = DATEADD(DAY, 1, @TodayStart);

    SELECT COUNT(*) AS Dropoff
    FROM Booking
    WHERE DropOffDate >= @TodayStart 
      AND DropOffDate < @TodayEnd
      AND IsActive = 1;
END
GO
