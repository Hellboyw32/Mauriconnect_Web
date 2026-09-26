USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spUpsertUserReportPermission]
    @UserId INT,
    @ReportType VARCHAR(50),
    @IsAllowed BIT
AS
BEGIN
    SET NOCOUNT ON;

    MERGE dbo.UserReportPermissions AS target
    USING (SELECT @UserId AS UserId, @ReportType AS ReportType) AS source
        ON target.UserId = source.UserId AND target.ReportType = source.ReportType
    WHEN MATCHED THEN
        UPDATE SET IsAllowed = @IsAllowed
    WHEN NOT MATCHED THEN
        INSERT (UserId, ReportType, IsAllowed)
        VALUES (@UserId, @ReportType, @IsAllowed);
END
GO
