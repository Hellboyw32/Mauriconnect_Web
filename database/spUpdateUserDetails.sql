USE [CarBooking]
GO

-- @Action = 'Add' requires @PasswordHash. @Action = 'Update' with @PasswordHash
-- NULL leaves the existing hash untouched (password changes go through
-- spChangeUserPassword instead, matching the "don't display/edit the password
-- inline" requirement). Username uniqueness is checked in the API service
-- before calling this (SELECT ... WHERE Username = @Username) so a friendly
-- "username already taken" message can be returned instead of a raw
-- constraint-violation error.
CREATE OR ALTER PROCEDURE [dbo].[spUpdateUserDetails]
    @Username VARCHAR(100),
    @EmailAccount VARCHAR(255),
    @UserType VARCHAR(10),
    @IsActive BIT,
    @IsAccountLocked BIT,
    @Login VARCHAR(100), -- acting user's UserId, as a string (matches existing @Login convention elsewhere)
    @Action VARCHAR(25),
    @UserId INT = NULL,
    @PasswordHash VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Action = 'Add'
    BEGIN
        INSERT INTO dbo.Users
            (Username, PasswordHash, EmailAccount, UserType, IsAccountLocked, IsActive, PasswordChangedAt, CreatedUserId, CreatedTimeStamp, LastModifiedUserId, LastModifiedTimeStamp)
        VALUES
            (@Username, @PasswordHash, @EmailAccount, @UserType, @IsAccountLocked, @IsActive, GETDATE(), TRY_CAST(@Login AS INT), GETDATE(), TRY_CAST(@Login AS INT), GETDATE());

        SELECT SCOPE_IDENTITY() AS UserId;
    END
    ELSE IF @Action = 'Update'
    BEGIN
        UPDATE dbo.Users
        SET Username = @Username,
            EmailAccount = @EmailAccount,
            UserType = @UserType,
            IsActive = @IsActive,
            IsAccountLocked = @IsAccountLocked,
            PasswordHash = ISNULL(@PasswordHash, PasswordHash),
            PasswordChangedAt = CASE WHEN @PasswordHash IS NOT NULL THEN GETDATE() ELSE PasswordChangedAt END,
            LastModifiedUserId = TRY_CAST(@Login AS INT),
            LastModifiedTimeStamp = GETDATE()
        WHERE UserId = @UserId;
    END
END
GO
