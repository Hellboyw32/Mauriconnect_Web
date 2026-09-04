USE [CarBooking]
GO

-- Returns PasswordHash - only ever call this from AuthService.login(). Every
-- other read path must go through spGetAllUsersJson / spGetSingleUserJson,
-- neither of which selects PasswordHash.
CREATE OR ALTER PROCEDURE [dbo].[spGetUserForLoginJson]
    @Username VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserId,
        u.Username,
        u.PasswordHash,
        u.EmailAccount,
        u.UserType,
        u.IsAccountLocked,
        u.IsActive,
        u.FailedLoginAttempts,
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
    WHERE u.Username = @Username
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO
