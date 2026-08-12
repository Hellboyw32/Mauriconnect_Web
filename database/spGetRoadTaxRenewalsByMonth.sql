USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Description: RoadTax ReNew report - active RoadTax records whose
-- EndDate falls within the given month/year (i.e. cars whose road tax
-- is due for renewal that month).
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spGetRoadTaxRenewalsByMonth]
    @Year INT,
    @Month INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CarNumber,
        c.Model,
        rt.StartDate,
        rt.EndDate
    FROM dbo.RoadTax rt
    JOIN dbo.Cars c ON c.CarId = rt.CarId
    WHERE rt.IsActive = 1
        AND c.IsActive = 1
        AND c.CarNumber NOT LIKE '%show%'
        AND c.CarNumber NOT LIKE '%source%'
        AND YEAR(rt.EndDate) = @Year
        AND MONTH(rt.EndDate) = @Month
    ORDER BY rt.EndDate ASC, c.CarNumber ASC;
END
GO
