USE [CarBooking]
GO

-- Sort the Car Servicing grid by most recently modified first, instead of by
-- DateServiced. DateServiced is NULL for auto-created "pending due" records
-- (see fix_booking_return_servicing_trigger.sql), which pushed them to the
-- bottom under the old ORDER BY DESC (NULLs sort lowest) - the opposite of
-- what's wanted, since those are exactly the records agents need to see first.
CREATE OR ALTER PROCEDURE [dbo].[spGetServicingHistoryJson]
    @CarNumber VARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.ServicingId,
        s.CarId,
        s.DateServiced,
        s.MileageServiced,
        c.ServicingFrequency,
        s.NextServicingMileage,
        s.Note,
        s.CreatedBy,
        s.CreatedOn,
        s.IsCompleted,
        JSON_QUERY((
            SELECT c.CarId, c.CarNumber, c.Model
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM dbo.Servicing s
    JOIN dbo.Cars c ON c.CarId = s.CarId
    WHERE s.IsDeleted = 0
        AND (@CarNumber IS NULL OR c.CarNumber LIKE '%' + @CarNumber + '%')
    ORDER BY s.LastModifiedTimeStamp DESC
    FOR JSON PATH;
END
GO
