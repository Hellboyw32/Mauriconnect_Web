USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetUserAnalytics]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        COUNT(*) AS TotalUsers,
        SUM(CASE WHEN IsActive = 1 AND IsAccountLocked = 0 THEN 1 ELSE 0 END) AS ActiveUsers,
        SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) AS InactiveUsers,
        SUM(CASE WHEN IsAccountLocked = 1 THEN 1 ELSE 0 END) AS LockedUsers,
        SUM(CASE WHEN UserType = 'Normal' THEN 1 ELSE 0 END) AS NormalUsers,
        SUM(CASE WHEN UserType = 'Admin' THEN 1 ELSE 0 END) AS AdminUsers
    FROM dbo.Users
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO
