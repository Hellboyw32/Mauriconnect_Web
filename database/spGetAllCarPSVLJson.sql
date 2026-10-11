USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetAllCarPSVLJson]
    @CarId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.PsvlId,
        p.CarId,
        p.StartDate,
        p.EndDate,
        p.Company,
        p.Note,
        p.IsActive,
        p.LastModifiedTimeStamp,
        p.LastModifiedUserId,
        JSON_QUERY((
            SELECT c.CarId, c.CarNumber, c.Model
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM dbo.CarPSVL p
    JOIN dbo.Cars c ON c.CarId = p.CarId
    WHERE p.IsActive = 1
        AND (@CarId IS NULL OR p.CarId = @CarId)
    ORDER BY p.StartDate DESC
    FOR JSON PATH;
END
GO
