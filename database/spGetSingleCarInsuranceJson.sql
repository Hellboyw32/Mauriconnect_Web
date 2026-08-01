USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetSingleCarInsuranceJson]
    @CarInsuranceId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ci.CarInsuranceId,
        ci.CarId,
        ci.StartDate,
        ci.EndDate,
        ci.Note,
        ci.IsActive,
        ci.LastModifiedTimeStamp,
        ci.LastModifiedUserId,
        JSON_QUERY((
            SELECT c.CarId, c.CarNumber, c.Model
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM dbo.CarInsurance ci
    JOIN dbo.Cars c ON c.CarId = ci.CarId
    WHERE ci.CarInsuranceId = @CarInsuranceId
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO
