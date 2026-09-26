USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetUserLoginLogsJson]
    @Username VARCHAR(100) = NULL,
    @FromDate DATETIME = NULL,
    @ToDate DATETIME = NULL,
    @LoginSuccessful BIT = NULL,
    @TopCount INT = 200
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@TopCount)
        l.Id,
        l.UserId,
        l.Username,
        l.LoginTimeStamp,
        l.LogoutTimeStamp,
        l.LoginSuccessful,
        l.FailureReason,
        l.IPAddress,
        l.UserAgent
    FROM dbo.UserLoginLog l
    WHERE (@Username IS NULL OR l.Username LIKE '%' + @Username + '%')
        AND (@FromDate IS NULL OR l.LoginTimeStamp >= @FromDate)
        AND (@ToDate IS NULL OR l.LoginTimeStamp <= @ToDate)
        AND (@LoginSuccessful IS NULL OR l.LoginSuccessful = @LoginSuccessful)
    ORDER BY l.LoginTimeStamp DESC
    FOR JSON PATH;
END
GO
