USE [CarBooking]
GO

-- Adds the 'Scheduler' module to the permission system. Absence of a row already
-- means "allowed" (default-allow, see add_user_permissions.sql), so this is only
-- needed so existing Normal users show an explicit all-true Scheduler row in the
-- permissions matrix instead of "unconfigured".
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserPermissions')
BEGIN
    INSERT INTO dbo.UserPermissions (UserId, Module, CanView, CanCreate, CanEdit, CanDelete)
    SELECT u.UserId, 'Scheduler', 1, 1, 1, 1
    FROM dbo.Users u
    WHERE u.UserType = 'Normal'
        AND NOT EXISTS (
            SELECT 1 FROM dbo.UserPermissions up
            WHERE up.UserId = u.UserId AND up.Module = 'Scheduler'
        );
END
GO
