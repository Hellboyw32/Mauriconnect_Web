USE [CarBooking]
GO

-- ===================== UserPermissions: Reports date window =====================
-- Only meaningful on the 'Reports' row. NULL = unrestricted in that
-- direction (default-allow, matching the rest of this permission system).
-- MaxDaysBeforeToday bounds how far back a report's start date can reach;
-- MaxDaysAfterToday bounds how far forward its end date can reach. Both are
-- measured as a rolling window from "today", not a fixed calendar date, so
-- they never need updating as time passes.
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='UserPermissions' AND COLUMN_NAME='MaxDaysBeforeToday')
BEGIN
    ALTER TABLE dbo.UserPermissions ADD MaxDaysBeforeToday INT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='UserPermissions' AND COLUMN_NAME='MaxDaysAfterToday')
BEGIN
    ALTER TABLE dbo.UserPermissions ADD MaxDaysAfterToday INT NULL;
END
GO

-- ===================== UserReportPermissions =====================
-- One row per (User, ReportType) - which specific reports a Normal user is
-- allowed to run at all. Same default-allow rule as UserPermissions: a
-- missing row means allowed.
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserReportPermissions')
BEGIN
    CREATE TABLE dbo.UserReportPermissions (
        UserId INT NOT NULL CONSTRAINT FK_UserReportPermissions_Users FOREIGN KEY REFERENCES dbo.Users(UserId),
        ReportType VARCHAR(50) NOT NULL,
        IsAllowed BIT NOT NULL CONSTRAINT DF_UserReportPermissions_IsAllowed DEFAULT (1),
        CONSTRAINT PK_UserReportPermissions PRIMARY KEY CLUSTERED (UserId, ReportType)
    );
END
GO

-- ===================== Seed: preserve existing Normal users' access =====================
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    INSERT INTO dbo.UserReportPermissions (UserId, ReportType, IsAllowed)
    SELECT u.UserId, rt.ReportType, 1
    FROM dbo.Users u
    CROSS JOIN (
        SELECT 'DailySchedule' AS ReportType
        UNION ALL SELECT 'Availability'
        UNION ALL SELECT 'Settlement'
        UNION ALL SELECT 'SimCard'
        UNION ALL SELECT 'Insurance'
    ) rt
    WHERE u.UserType = 'Normal'
        AND NOT EXISTS (
            SELECT 1 FROM dbo.UserReportPermissions urp
            WHERE urp.UserId = u.UserId AND urp.ReportType = rt.ReportType
        );
END
GO
