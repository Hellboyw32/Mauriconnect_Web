USE [CarBooking]
GO

-- ===================== Users =====================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    CREATE TABLE dbo.Users (
        UserId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users_UserId PRIMARY KEY CLUSTERED,
        Username VARCHAR(100) NOT NULL,
        PasswordHash VARCHAR(255) NOT NULL,
        EmailAccount VARCHAR(255) NOT NULL,
        UserType VARCHAR(10) NOT NULL CONSTRAINT DF_Users_UserType DEFAULT ('Normal')
            CONSTRAINT CK_Users_UserType CHECK (UserType IN ('Normal', 'Admin')),
        IsAccountLocked BIT NOT NULL CONSTRAINT DF_Users_IsAccountLocked DEFAULT (0),
        IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
        FailedLoginAttempts INT NOT NULL CONSTRAINT DF_Users_FailedLoginAttempts DEFAULT (0),
        LastFailedLogin DATETIME NULL,
        LastLoggedIn DATETIME NULL,
        PasswordChangedAt DATETIME NULL,
        CreatedUserId INT NULL CONSTRAINT FK_Users_CreatedUserId REFERENCES dbo.Users(UserId),
        CreatedTimeStamp DATETIME NOT NULL CONSTRAINT DF_Users_CreatedTimeStamp DEFAULT (GETDATE()),
        LastModifiedUserId INT NULL CONSTRAINT FK_Users_LastModifiedUserId REFERENCES dbo.Users(UserId),
        LastModifiedTimeStamp DATETIME NOT NULL CONSTRAINT DF_Users_LastModifiedTimeStamp DEFAULT (GETDATE())
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Users_Username' AND object_id = OBJECT_ID('dbo.Users'))
BEGIN
    CREATE UNIQUE INDEX UX_Users_Username ON dbo.Users(Username);
END
GO

-- ===================== UserLoginLog =====================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserLoginLog')
BEGIN
    CREATE TABLE dbo.UserLoginLog (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserLoginLog_Id PRIMARY KEY CLUSTERED,
        UserId INT NULL CONSTRAINT FK_UserLoginLog_Users FOREIGN KEY REFERENCES dbo.Users(UserId),
        Username VARCHAR(100) NOT NULL,
        LoginTimeStamp DATETIME NOT NULL CONSTRAINT DF_UserLoginLog_LoginTimeStamp DEFAULT (GETDATE()),
        LogoutTimeStamp DATETIME NULL,
        LoginSuccessful BIT NOT NULL,
        FailureReason VARCHAR(200) NULL,
        IPAddress VARCHAR(50) NULL,
        UserAgent VARCHAR(500) NULL,
        CreatedTimeStamp DATETIME NOT NULL CONSTRAINT DF_UserLoginLog_CreatedTimeStamp DEFAULT (GETDATE())
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserLoginLog_UserId' AND object_id = OBJECT_ID('dbo.UserLoginLog'))
BEGIN
    CREATE INDEX IX_UserLoginLog_UserId ON dbo.UserLoginLog(UserId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserLoginLog_LoginTimeStamp' AND object_id = OBJECT_ID('dbo.UserLoginLog'))
BEGIN
    CREATE INDEX IX_UserLoginLog_LoginTimeStamp ON dbo.UserLoginLog(LoginTimeStamp);
END
GO

-- ===================== AuditLog =====================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AuditLog')
BEGIN
    CREATE TABLE dbo.AuditLog (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditLog_Id PRIMARY KEY CLUSTERED,
        UserId INT NULL CONSTRAINT FK_AuditLog_Users FOREIGN KEY REFERENCES dbo.Users(UserId),
        Username VARCHAR(100) NULL,
        Action VARCHAR(100) NOT NULL,
        EntityType VARCHAR(100) NOT NULL,
        EntityId VARCHAR(100) NULL,
        Description VARCHAR(500) NULL,
        Timestamp DATETIME NOT NULL CONSTRAINT DF_AuditLog_Timestamp DEFAULT (GETDATE()),
        IPAddress VARCHAR(50) NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLog_UserId' AND object_id = OBJECT_ID('dbo.AuditLog'))
BEGIN
    CREATE INDEX IX_AuditLog_UserId ON dbo.AuditLog(UserId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLog_Timestamp' AND object_id = OBJECT_ID('dbo.AuditLog'))
BEGIN
    CREATE INDEX IX_AuditLog_Timestamp ON dbo.AuditLog(Timestamp);
END
GO

-- ===================== Bootstrap admin =====================
-- Username: admin   Password: ChangeMe#2026
-- This is a bcrypt hash (cost 12) of "ChangeMe#2026", generated with bcryptjs.
-- Log in with this once, then change the password immediately from
-- Administration > Users > admin > Reset Password.
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = 'admin')
BEGIN
    INSERT INTO dbo.Users (Username, PasswordHash, EmailAccount, UserType, IsAccountLocked, IsActive, PasswordChangedAt, CreatedTimeStamp, LastModifiedTimeStamp)
    VALUES ('admin', '$2b$12$6nNyM0VxQVs6yP9HA3zfO.tVSCeX4om29OCflsEQX50Vh.BtIbi82', 'admin@mauriconnect.com', 'Admin', 0, 1, GETDATE(), GETDATE(), GETDATE());
END
GO
