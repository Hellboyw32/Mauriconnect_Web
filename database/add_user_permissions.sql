USE [CarBooking]
GO

-- ===================== UserPermissions =====================
-- One row per (User, Module). Default-allow: every flag defaults to 1, and
-- the API treats a *missing* row as fully allowed too (see UserService) -
-- this is a restriction layered onto users who already had full access, not
-- a fresh allow-list, so absence of data must never silently lock anyone out.
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserPermissions')
BEGIN
    CREATE TABLE dbo.UserPermissions (
        UserId INT NOT NULL CONSTRAINT FK_UserPermissions_Users FOREIGN KEY REFERENCES dbo.Users(UserId),
        Module VARCHAR(50) NOT NULL,
        CanView BIT NOT NULL CONSTRAINT DF_UserPermissions_CanView DEFAULT (1),
        CanCreate BIT NOT NULL CONSTRAINT DF_UserPermissions_CanCreate DEFAULT (1),
        CanEdit BIT NOT NULL CONSTRAINT DF_UserPermissions_CanEdit DEFAULT (1),
        CanDelete BIT NOT NULL CONSTRAINT DF_UserPermissions_CanDelete DEFAULT (1),
        CONSTRAINT PK_UserPermissions PRIMARY KEY CLUSTERED (UserId, Module)
    );
END
GO

-- ===================== Seed: preserve existing Normal users' access =====================
-- Without this, every existing Normal user would show as "unconfigured" in
-- the new permissions matrix even though their real access today is
-- unrestricted - seed explicit all-true rows so the UI reflects reality.
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    INSERT INTO dbo.UserPermissions (UserId, Module, CanView, CanCreate, CanEdit, CanDelete)
    SELECT u.UserId, m.Module, 1, 1, 1, 1
    FROM dbo.Users u
    CROSS JOIN (
        SELECT 'Bookings' AS Module
        UNION ALL SELECT 'Cars'
        UNION ALL SELECT 'CarInsurance'
        UNION ALL SELECT 'RoadTax'
        UNION ALL SELECT 'FitnessCertificate'
        UNION ALL SELECT 'Reports'
    ) m
    WHERE u.UserType = 'Normal'
        AND NOT EXISTS (
            SELECT 1 FROM dbo.UserPermissions up
            WHERE up.UserId = u.UserId AND up.Module = m.Module
        );
END
GO
