USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Description: Car Servicing report - every active car that currently has a
-- pending servicing record (not completed, not deleted), longest-waiting
-- first. Takes no parameters. Outsource placeholder and NO-SHOW cars are
-- excluded, matching the dashboard scheduler.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spGetCarServicingReport]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CarId,
        c.CarNumber,
        c.Model,
        cc.Category                           AS CategoryName,
        c.CurrentMileage,
        c.LastServicedMileage,
        c.ServicingFrequency,
        s.ServicingId,
        s.CreatedOn                           AS PendingSince,
        DATEDIFF(DAY, s.CreatedOn, GETDATE()) AS DaysPending
    FROM dbo.Servicing s
    JOIN dbo.Cars c ON c.CarId = s.CarId
    LEFT JOIN dbo.CarCategory cc ON cc.CategoryId = c.CategoryId
    WHERE s.IsCompleted = 0
      AND s.IsDeleted = 0
      AND c.IsActive = 1
      AND c.CarNumber NOT LIKE '%Outsource%'
      AND c.CarNumber NOT LIKE '%SHOW%'
    ORDER BY s.CreatedOn;   -- longest-waiting first
END
GO
