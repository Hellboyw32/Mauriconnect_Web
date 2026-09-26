USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetSingleUserJson]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserId,
        u.Username,
        u.EmailAccount,
        u.UserType,
        u.IsAccountLocked,
        u.IsActive,
        u.FailedLoginAttempts,
        u.LastFailedLogin,
        u.LastLoggedIn,
        u.PasswordChangedAt,
        u.CreatedUserId,
        creator.Username AS CreatedByUsername,
        u.CreatedTimeStamp,
        u.LastModifiedUserId,
        modifier.Username AS LastModifiedByUsername,
        u.LastModifiedTimeStamp,
        JSON_QUERY((
            SELECT Module, CanView, CanCreate, CanEdit, CanDelete, MaxDaysBeforeToday, MaxDaysAfterToday
            FROM dbo.UserPermissions
            WHERE UserId = u.UserId
            FOR JSON PATH
        )) AS Permissions,
        JSON_QUERY((
            SELECT ReportType, IsAllowed
            FROM dbo.UserReportPermissions
            WHERE UserId = u.UserId
            FOR JSON PATH
        )) AS ReportTypes
    FROM dbo.Users u
    LEFT JOIN dbo.Users creator ON creator.UserId = u.CreatedUserId
    LEFT JOIN dbo.Users modifier ON modifier.UserId = u.LastModifiedUserId
    WHERE u.UserId = @UserId
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO
