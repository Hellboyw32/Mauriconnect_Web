USE [CarBooking]
GO

-- Keep Pending servicing records at the top of the grid regardless of when they were
-- last touched. fix_servicing_history_sort.sql ordered purely by LastModifiedTimeStamp
-- DESC so pending records (DateServiced NULL) wouldn't sort to the bottom - but now that
-- completing a record (see fix_servicing_iscompleted_checkbox.sql) also bumps its
-- LastModifiedTimeStamp, a just-completed record floats back above still-pending ones.
-- Sort by IsCompleted first (0/Pending before 1/Completed), then by recency within
-- each group.
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
    ORDER BY s.IsCompleted ASC, s.LastModifiedTimeStamp DESC
    FOR JSON PATH;
END
GO
