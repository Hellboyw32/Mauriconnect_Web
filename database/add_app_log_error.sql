USE [CarBooking]
GO

-- ===================== AppLogError =====================
-- Central store for every error raised by the portal (API, client, DB, timeouts...).
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AppLogError')
BEGIN
    CREATE TABLE dbo.AppLogError (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AppLogError_Id PRIMARY KEY CLUSTERED,

        -- What kind of error it is
        ErrorCategory VARCHAR(30) NOT NULL
            CONSTRAINT CK_AppLogError_ErrorCategory CHECK (ErrorCategory IN (
                'ApiError',          -- handled error returned by an API route (4xx/5xx)
                'ApplicationError',  -- unhandled exception / rejection in the API or client code
                'Timeout',           -- request, DB or FTP timeout
                'DatabaseError',     -- SQL Server / stored procedure failure
                'NetworkError',      -- client could not reach the API
                'ValidationError',   -- request payload rejected
                'AuthError',         -- 401/403, token problems
                'FtpError',          -- file upload / FTP failure
                'ClientError',       -- window.onerror / React ErrorBoundary
                'Other')),
        Severity VARCHAR(10) NOT NULL CONSTRAINT DF_AppLogError_Severity DEFAULT ('Error')
            CONSTRAINT CK_AppLogError_Severity CHECK (Severity IN ('Warning', 'Error', 'Fatal')),
        Source VARCHAR(10) NOT NULL CONSTRAINT DF_AppLogError_Source DEFAULT ('Api')
            CONSTRAINT CK_AppLogError_Source CHECK (Source IN ('Api', 'Client')),

        -- The error itself
        ErrorCode VARCHAR(100) NULL,            -- e.g. ECONNABORTED, ETIMEOUT, EREQUEST
        ErrorMessage NVARCHAR(MAX) NOT NULL,
        StackTrace NVARCHAR(MAX) NULL,

        -- Where it happened
        HttpMethod VARCHAR(10) NULL,
        RequestUrl VARCHAR(2000) NULL,
        StatusCode INT NULL,
        RequestBody NVARCHAR(MAX) NULL,         -- never store passwords/tokens here
        ComponentName VARCHAR(200) NULL,        -- service/route (API) or page/component (client)

        -- Who / from where
        UserId INT NULL CONSTRAINT FK_AppLogError_Users FOREIGN KEY REFERENCES dbo.Users(UserId),
        Username VARCHAR(100) NULL,
        IPAddress VARCHAR(50) NULL,
        UserAgent VARCHAR(500) NULL,

        -- Tracking
        Environment VARCHAR(20) NULL,           -- development / production
        IsResolved BIT NOT NULL CONSTRAINT DF_AppLogError_IsResolved DEFAULT (0),
        ResolvedUserId INT NULL CONSTRAINT FK_AppLogError_ResolvedUsers FOREIGN KEY REFERENCES dbo.Users(UserId),
        ResolvedTimeStamp DATETIME NULL,
        CreatedTimeStamp DATETIME NOT NULL CONSTRAINT DF_AppLogError_CreatedTimeStamp DEFAULT (GETDATE())
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AppLogError_CreatedTimeStamp' AND object_id = OBJECT_ID('dbo.AppLogError'))
BEGIN
    CREATE INDEX IX_AppLogError_CreatedTimeStamp ON dbo.AppLogError(CreatedTimeStamp DESC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AppLogError_ErrorCategory' AND object_id = OBJECT_ID('dbo.AppLogError'))
BEGIN
    CREATE INDEX IX_AppLogError_ErrorCategory ON dbo.AppLogError(ErrorCategory, CreatedTimeStamp DESC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AppLogError_UserId' AND object_id = OBJECT_ID('dbo.AppLogError'))
BEGIN
    CREATE INDEX IX_AppLogError_UserId ON dbo.AppLogError(UserId);
END
GO
