USE [CarBooking]
GO

-- @PasswordHash is always pre-hashed (bcryptjs) by the API before this is called.
CREATE OR ALTER PROCEDURE [dbo].[spChangeUserPassword]
    @UserId INT,
    @PasswordHash VARCHAR(255),
    @Login VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Users
    SET PasswordHash = @PasswordHash,
        PasswordChangedAt = GETDATE(),
        LastModifiedUserId = TRY_CAST(@Login AS INT),
        LastModifiedTimeStamp = GETDATE()
    WHERE UserId = @UserId;
END
GO
