USE [CarBooking]
GO

-- Unlocking also resets FailedLoginAttempts, otherwise the very next bad
-- password would immediately re-trigger the auto-lock threshold.
CREATE OR ALTER PROCEDURE [dbo].[spLockUnlockUser]
    @UserId INT,
    @IsAccountLocked BIT,
    @Login VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Users
    SET IsAccountLocked = @IsAccountLocked,
        FailedLoginAttempts = CASE WHEN @IsAccountLocked = 0 THEN 0 ELSE FailedLoginAttempts END,
        LastModifiedUserId = TRY_CAST(@Login AS INT),
        LastModifiedTimeStamp = GETDATE()
    WHERE UserId = @UserId;
END
GO
