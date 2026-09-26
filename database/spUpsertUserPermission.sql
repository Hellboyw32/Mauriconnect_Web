USE [CarBooking]
GO

-- One call per (User, Module) row - the API loops this once per module when
-- an admin saves the permissions matrix, mirroring how spLockUnlockUser is
-- one call per action rather than a single bulk-save procedure.
-- @MaxDaysBeforeToday/@MaxDaysAfterToday are only meaningful for the
-- 'Reports' row (NULL = unrestricted); harmless to pass NULL for every
-- other module.
CREATE OR ALTER PROCEDURE [dbo].[spUpsertUserPermission]
    @UserId INT,
    @Module VARCHAR(50),
    @CanView BIT,
    @CanCreate BIT,
    @CanEdit BIT,
    @CanDelete BIT,
    @MaxDaysBeforeToday INT = NULL,
    @MaxDaysAfterToday INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    MERGE dbo.UserPermissions AS target
    USING (SELECT @UserId AS UserId, @Module AS Module) AS source
        ON target.UserId = source.UserId AND target.Module = source.Module
    WHEN MATCHED THEN
        UPDATE SET CanView = @CanView, CanCreate = @CanCreate, CanEdit = @CanEdit, CanDelete = @CanDelete,
            MaxDaysBeforeToday = @MaxDaysBeforeToday, MaxDaysAfterToday = @MaxDaysAfterToday
    WHEN NOT MATCHED THEN
        INSERT (UserId, Module, CanView, CanCreate, CanEdit, CanDelete, MaxDaysBeforeToday, MaxDaysAfterToday)
        VALUES (@UserId, @Module, @CanView, @CanCreate, @CanEdit, @CanDelete, @MaxDaysBeforeToday, @MaxDaysAfterToday);
END
GO
