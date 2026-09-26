USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetUserReportPermissionsJson]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ReportType,
        IsAllowed
    FROM dbo.UserReportPermissions
    WHERE UserId = @UserId
    ORDER BY ReportType
    FOR JSON PATH;
END
GO
