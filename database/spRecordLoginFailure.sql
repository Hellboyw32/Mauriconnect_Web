USE [CarBooking]
GO

-- @UserId is NULL when the username itself didn't match anything - we still
-- log the attempt (Username as typed) but there's no account to increment a
-- counter on or lock. When @UserId is provided, incrementing past
-- @MaxFailedAttempts auto-locks the account (spec section 8).
CREATE OR ALTER PROCEDURE [dbo].[spRecordLoginFailure]
    @Username VARCHAR(100),
    @UserId INT = NULL,
    @FailureReason VARCHAR(200),
    @MaxFailedAttempts INT,
    @IPAddress VARCHAR(50) = NULL,
    @UserAgent VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @UserId IS NOT NULL
    BEGIN
        UPDATE dbo.Users
        SET FailedLoginAttempts = FailedLoginAttempts + 1,
            LastFailedLogin = GETDATE(),
            IsAccountLocked = CASE WHEN FailedLoginAttempts + 1 >= @MaxFailedAttempts THEN 1 ELSE IsAccountLocked END
        WHERE UserId = @UserId;
    END

    INSERT INTO dbo.UserLoginLog (UserId, Username, LoginTimeStamp, LoginSuccessful, FailureReason, IPAddress, UserAgent)
    VALUES (@UserId, @Username, GETDATE(), 0, @FailureReason, @IPAddress, @UserAgent);
END
GO
