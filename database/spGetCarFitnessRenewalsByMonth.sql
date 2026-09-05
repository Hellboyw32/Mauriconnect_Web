USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Description: Car Fitness ReNew report - active CarFitness records whose
-- EndDate falls within the given month/year (i.e. cars whose fitness
-- certificate is due for renewal that month).
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spGetCarFitnessRenewalsByMonth]
    @Year INT,
    @Month INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CarNumber,
        c.Model,
        fc.StartDate,
        fc.EndDate
    FROM dbo.CarFitness fc
    JOIN dbo.Cars c ON c.CarId = fc.CarId
    WHERE fc.IsActive = 1
        AND c.IsActive = 1
        AND c.CarNumber NOT LIKE '%show%'
        AND c.CarNumber NOT LIKE '%source%'
        AND YEAR(fc.EndDate) = @Year
        AND MONTH(fc.EndDate) = @Month
    ORDER BY fc.EndDate ASC, c.CarNumber ASC;
END
GO
