USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetLoginAnalytics]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TodayStart DATETIME = CAST(GETDATE() AS DATE);
    DECLARE @WeekStart DATETIME = DATEADD(DAY, -DATEPART(WEEKDAY, GETDATE()) + 1, CAST(GETDATE() AS DATE));

    SELECT
        SUM(CASE WHEN LoginTimeStamp >= @TodayStart AND LoginSuccessful = 1 THEN 1 ELSE 0 END) AS SuccessfulLoginsToday,
        SUM(CASE WHEN LoginTimeStamp >= @TodayStart AND LoginSuccessful = 0 THEN 1 ELSE 0 END) AS FailedLoginsToday,
        SUM(CASE WHEN LoginTimeStamp >= @WeekStart AND LoginSuccessful = 1 THEN 1 ELSE 0 END) AS SuccessfulLoginsThisWeek,
        SUM(CASE WHEN LoginTimeStamp >= @WeekStart AND LoginSuccessful = 0 THEN 1 ELSE 0 END) AS FailedLoginsThisWeek
    FROM dbo.UserLoginLog
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO
