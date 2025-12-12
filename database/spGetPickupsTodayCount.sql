-- =============================================
-- Author:		Auto-generated
-- Create date: 2025-12-08
-- Description:	Get count of cars with pickup date today
-- =============================================
CREATE PROCEDURE [dbo].[spGetPickupsTodayCount]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TodayStart DATETIME = CAST(GETDATE() AS DATE);
    DECLARE @TodayEnd DATETIME = DATEADD(DAY, 1, @TodayStart);

    SELECT COUNT(*) AS Pickup
    FROM Booking
    WHERE PickUpDate >= @TodayStart 
      AND PickUpDate < @TodayEnd
      AND IsActive = 1;
END
GO
