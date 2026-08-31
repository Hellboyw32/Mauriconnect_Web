USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetAuditLogsJson]
    @Username VARCHAR(100) = NULL,
    @Action VARCHAR(100) = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL,
    @TopCount INT = 200
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@TopCount)
        a.Id,
        a.UserId,
        a.Username,
        a.Action,
        a.EntityType,
        a.EntityId,
        a.Description,
        a.Timestamp,
        a.IPAddress
    FROM dbo.AuditLog a
    WHERE (@Username IS NULL OR a.Username LIKE '%' + @Username + '%')
        AND (@Action IS NULL OR a.Action = @Action)
        AND (@FromDate IS NULL OR a.Timestamp >= @FromDate)
        AND (@ToDate IS NULL OR a.Timestamp <= @ToDate)
    ORDER BY a.Timestamp DESC
    FOR JSON PATH;
END
GO
