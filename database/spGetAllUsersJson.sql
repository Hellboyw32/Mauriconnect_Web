USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetAllUsersJson]
    @Username VARCHAR(100) = NULL,
    @UserType VARCHAR(10) = NULL,
    @Status VARCHAR(10) = NULL -- 'Active' | 'Inactive' | 'Locked' | NULL (all)
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
        u.LastModifiedTimeStamp
    FROM dbo.Users u
    LEFT JOIN dbo.Users creator ON creator.UserId = u.CreatedUserId
    LEFT JOIN dbo.Users modifier ON modifier.UserId = u.LastModifiedUserId
    WHERE (@Username IS NULL OR u.Username LIKE '%' + @Username + '%')
        AND (@UserType IS NULL OR u.UserType = @UserType)
        AND (
            @Status IS NULL
            OR (@Status = 'Active' AND u.IsActive = 1 AND u.IsAccountLocked = 0)
            OR (@Status = 'Inactive' AND u.IsActive = 0)
            OR (@Status = 'Locked' AND u.IsAccountLocked = 1)
        )
    ORDER BY u.Username
    FOR JSON PATH;
END
GO
