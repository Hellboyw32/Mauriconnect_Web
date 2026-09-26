USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetUserPermissionsJson]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Module,
        CanView,
        CanCreate,
        CanEdit,
        CanDelete,
        MaxDaysBeforeToday,
        MaxDaysAfterToday
    FROM dbo.UserPermissions
    WHERE UserId = @UserId
    ORDER BY Module
    FOR JSON PATH;
END
GO
