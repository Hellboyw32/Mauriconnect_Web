USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetAllRoadTaxJson]
    @CarNumber VARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        rt.RoadTaxId,
        rt.CarId,
        rt.StartDate,
        rt.EndDate,
        rt.Note,
        rt.IsActive,
        rt.LastModifiedTimeStamp,
        rt.LastModifiedUserId,
        JSON_QUERY((
            SELECT c.CarId, c.CarNumber, c.Model
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM dbo.RoadTax rt
    JOIN dbo.Cars c ON c.CarId = rt.CarId
    WHERE rt.IsActive = 1
        AND c.CarNumber NOT LIKE '%outsource%'
        AND (@CarNumber IS NULL OR c.CarNumber LIKE '%' + @CarNumber + '%')
    ORDER BY rt.StartDate DESC
    FOR JSON PATH;
END
GO
