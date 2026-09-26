USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spRecordLoginSuccess]
    @UserId INT,
    @Username VARCHAR(100),
    @IPAddress VARCHAR(50) = NULL,
    @UserAgent VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Users
    SET FailedLoginAttempts = 0,
        LastLoggedIn = GETDATE()
    WHERE UserId = @UserId;

    INSERT INTO dbo.UserLoginLog (UserId, Username, LoginTimeStamp, LoginSuccessful, IPAddress, UserAgent)
    VALUES (@UserId, @Username, GETDATE(), 1, @IPAddress, @UserAgent);

    SELECT SCOPE_IDENTITY() AS LoginLogId;
END
GO
