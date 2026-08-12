USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetAllCarInsuranceJson]
    @CarNumber VARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ci.CarInsuranceId,
        ci.CarId,
        ci.StartDate,
        ci.EndDate,
        ci.Note,
        ci.PolicyNumber,
        ci.Insurer,
        ci.CoverageType,
        ci.Premium,
        ci.IsActive,
        ci.LastModifiedTimeStamp,
        ci.LastModifiedUserId,
        JSON_QUERY((
            SELECT c.CarId, c.CarNumber, c.Model
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM dbo.CarInsurance ci
    JOIN dbo.Cars c ON c.CarId = ci.CarId
    WHERE ci.IsActive = 1
        AND (@CarNumber IS NULL OR c.CarNumber LIKE '%' + @CarNumber + '%')
    ORDER BY ci.StartDate DESC
    FOR JSON PATH;
END
GO
