USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Description: Car Insurance ReNew report - active CarInsurance records whose
-- EndDate falls within the given month/year (i.e. cars whose insurance
-- is due for renewal that month).
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spGetCarInsuranceRenewalsByMonth]
    @Year INT,
    @Month INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CarNumber,
        c.Model,
        ci.StartDate,
        ci.EndDate
    FROM dbo.CarInsurance ci
    JOIN dbo.Cars c ON c.CarId = ci.CarId
    WHERE ci.IsActive = 1
        AND c.IsActive = 1
        AND c.CarNumber NOT LIKE '%show%'
        AND c.CarNumber NOT LIKE '%source%'
        AND YEAR(ci.EndDate) = @Year
        AND MONTH(ci.EndDate) = @Month
    ORDER BY ci.EndDate ASC, c.CarNumber ASC;
END
GO
