USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetAllFitnessCertificateJson]
    @CarNumber VARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        fc.FitnessId,
        fc.CarId,
        fc.StartDate,
        fc.EndDate,
        fc.Note,
        fc.CertificateNumber,
        fc.IssuedBy,
        fc.IsActive,
        fc.LastModifiedTimeStamp,
        fc.LastModifiedUserId,
        JSON_QUERY((
            SELECT c.CarId, c.CarNumber, c.Model
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM dbo.CarFitness fc
    JOIN dbo.Cars c ON c.CarId = fc.CarId
    WHERE fc.IsActive = 1
        AND (@CarNumber IS NULL OR c.CarNumber LIKE '%' + @CarNumber + '%')
    ORDER BY fc.StartDate DESC
    FOR JSON PATH;
END
GO
