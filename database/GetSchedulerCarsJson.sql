USE [CarBooking]
GO

-- Cars-only version of GetSchedulerCategoryByCarJson. The original LEFT JOINs the
-- whole Booking table (one row per car per booking, unbounded), which is too heavy
-- for the dashboard scheduler - bookings are loaded separately and date-bounded by
-- SPGetAllBookingForSchedulerJson.
CREATE OR ALTER PROCEDURE [dbo].[GetSchedulerCarsJson]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CarId,
        c.CarNumber,
        c.Model,
        c.CategoryId,
        cc.Category AS CategoryName
    FROM dbo.Cars c
    INNER JOIN dbo.CarCategory cc ON c.CategoryId = cc.CategoryId
    WHERE c.IsActive = 1
      AND c.CarNumber NOT LIKE '%Outsource%'
      AND c.CarNumber NOT LIKE '%NO-SHOW%'
      AND cc.IsActive = 1
    ORDER BY cc.Category, PATINDEX('%Out%', c.Model) ASC, c.CarNumber
    FOR JSON PATH;
END
GO
