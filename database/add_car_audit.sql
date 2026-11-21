USE [CarBooking]
GO

-- ===================== CarAudit =====================
-- Field-level history of the Cars table, in the same shape as BookingAudit
-- (one row per changed column: old value -> new value, who, when), plus WHICH
-- stored procedure made the change. That last part matters for fields like
-- LastServicedMileage / CurrentMileage, which are written by several different
-- procedures (Cars screen, servicing screens, booking return) and were
-- previously impossible to tell apart. History starts when this script is run -
-- earlier changes cannot be reconstructed.
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CarAudit')
BEGIN
    CREATE TABLE dbo.CarAudit (
        AuditId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CarAudit_AuditId PRIMARY KEY CLUSTERED,
        CarId INT NOT NULL,                              -- no FK: the history must outlive any change to Cars
        CarNumber NVARCHAR(100) NULL,                    -- snapshot, so rows stay readable
        Action VARCHAR(10) NOT NULL,                     -- INSERT / UPDATE
        DB_COLUMN_NAME VARCHAR(100) NOT NULL,
        OLD_VALUE NVARCHAR(MAX) NULL,
        NEW_VALUE NVARCHAR(MAX) NULL,
        -- The app user, when the statement also stamped Cars.LastModifiedUserId. Procedures that
        -- touch a car without stamping it (booking return, servicing screens) leave this NULL -
        -- use UPDATED_BY_PROC to see what ran.
        MODIFIED_BY VARCHAR(200) NULL,
        MODIFIED_DATE DATETIME NOT NULL CONSTRAINT DF_CarAudit_MODIFIED_DATE DEFAULT (GETDATE()),
        UPDATED_BY_PROC SYSNAME NULL,                    -- e.g. spUpdateCarDetails, spUpdateBookingDetails
        DB_LOGIN SYSNAME NULL CONSTRAINT DF_CarAudit_DB_LOGIN DEFAULT (SUSER_SNAME())
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CarAudit_CarId_Date' AND object_id = OBJECT_ID('dbo.CarAudit'))
    CREATE INDEX IX_CarAudit_CarId_Date ON dbo.CarAudit(CarId, MODIFIED_DATE DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CarAudit_Column_Date' AND object_id = OBJECT_ID('dbo.CarAudit'))
    CREATE INDEX IX_CarAudit_Column_Date ON dbo.CarAudit(DB_COLUMN_NAME, MODIFIED_DATE DESC);
GO

-- ===================== Trigger =====================
-- Set-based (correct for multi-row updates). Tracks every business column of Cars;
-- LastModifiedTimeStamp / LastModifiedUserId are metadata and only used to name the user.
-- If a column is added to Cars, add it to the VALUES list below.
-- The audit work is wrapped in TRY/CATCH so a problem here can never block the booking,
-- servicing or car update that fired it.
CREATE OR ALTER TRIGGER [dbo].[tr_Cars_Audit]
ON [dbo].[Cars]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- WHAT made this change: the stored procedure the application called. Inside a trigger
        -- the "current module" is the trigger itself, so read the ORIGINAL command sent by the
        -- client instead (its input buffer): an RPC call shows as
        -- "Proc [Database Id = n Object Id = m]", a plain batch as its SQL text.
        DECLARE @proc SYSNAME = NULL;
        BEGIN TRY
            DECLARE @cmd NVARCHAR(4000), @dbId INT, @objId INT, @pos INT;

            SELECT @cmd = ib.event_info
            FROM sys.dm_exec_requests r
            CROSS APPLY sys.dm_exec_input_buffer(r.session_id, r.request_id) ib
            WHERE r.session_id = @@SPID;

            SET @cmd = REPLACE(@cmd, NCHAR(0), N'');   -- RPC buffers end in a NUL

            IF @cmd NOT LIKE N'% %' AND CHARINDEX(N';', @cmd) > 1
            BEGIN
                -- RPC by name, e.g. "CarBooking.dbo.spAddServicingRecord;1" (what the Node API sends)
                SET @proc = REPLACE(REPLACE(PARSENAME(LEFT(@cmd, CHARINDEX(N';', @cmd) - 1), 1), N'[', N''), N']', N'');
            END
            ELSE IF @cmd LIKE N'Proc [[]Database Id = %Object Id = %]'
            BEGIN
                SET @pos = CHARINDEX(N'Database Id = ', @cmd) + LEN(N'Database Id = ');
                SET @dbId = TRY_CAST(SUBSTRING(@cmd, @pos, CHARINDEX(N' ', @cmd, @pos) - @pos) AS INT);
                SET @pos = CHARINDEX(N'Object Id = ', @cmd) + LEN(N'Object Id = ');
                SET @objId = TRY_CAST(SUBSTRING(@cmd, @pos, CHARINDEX(N']', @cmd, @pos) - @pos) AS INT);
                SET @proc = OBJECT_NAME(@objId, @dbId);
            END
            ELSE IF @cmd IS NOT NULL
                SET @proc = LEFT(N'ad-hoc: ' + REPLACE(REPLACE(@cmd, CHAR(13), N' '), CHAR(10), N' '), 128);
        END TRY
        BEGIN CATCH
            SET @proc = NULL;   -- e.g. no VIEW SERVER STATE permission: still audit, just without the source
        END CATCH;

        IF NOT EXISTS (SELECT 1 FROM deleted)
        BEGIN
            INSERT INTO dbo.CarAudit (CarId, CarNumber, Action, DB_COLUMN_NAME, OLD_VALUE, NEW_VALUE, MODIFIED_BY, UPDATED_BY_PROC)
            SELECT i.CarId, i.CarNumber, 'INSERT', '(car created)', NULL,
                   CONCAT(i.CarNumber, ' - ', i.Model,
                          ' | CurrentMileage=', i.CurrentMileage,
                          ' | ServicingFrequency=', i.ServicingFrequency,
                          ' | LastServicedMileage=', i.LastServicedMileage),
                   i.LastModifiedUserId, @proc
            FROM inserted i;

            RETURN;
        END

        INSERT INTO dbo.CarAudit (CarId, CarNumber, Action, DB_COLUMN_NAME, OLD_VALUE, NEW_VALUE, MODIFIED_BY, UPDATED_BY_PROC)
        SELECT
            i.CarId,
            i.CarNumber,
            'UPDATE',
            v.ColumnName,
            v.OldValue,
            v.NewValue,
            CASE WHEN ISNULL(i.LastModifiedTimeStamp, '19000101') <> ISNULL(d.LastModifiedTimeStamp, '19000101')
                 THEN i.LastModifiedUserId END,
            @proc
        FROM inserted i
        JOIN deleted d ON d.CarId = i.CarId
        CROSS APPLY (VALUES
            ('CategoryId',          CAST(d.CategoryId AS NVARCHAR(MAX)),          CAST(i.CategoryId AS NVARCHAR(MAX))),
            ('Model',               CAST(d.Model AS NVARCHAR(MAX)),               CAST(i.Model AS NVARCHAR(MAX))),
            ('CarNumber',           CAST(d.CarNumber AS NVARCHAR(MAX)),           CAST(i.CarNumber AS NVARCHAR(MAX))),
            ('Description',         CAST(d.Description AS NVARCHAR(MAX)),         CAST(i.Description AS NVARCHAR(MAX))),
            ('IsActive',            CAST(d.IsActive AS NVARCHAR(MAX)),            CAST(i.IsActive AS NVARCHAR(MAX))),
            ('SortOrder',           CAST(d.SortOrder AS NVARCHAR(MAX)),           CAST(i.SortOrder AS NVARCHAR(MAX))),
            ('CurrentMileage',      CAST(d.CurrentMileage AS NVARCHAR(MAX)),      CAST(i.CurrentMileage AS NVARCHAR(MAX))),
            ('ServicingFrequency',  CAST(d.ServicingFrequency AS NVARCHAR(MAX)),  CAST(i.ServicingFrequency AS NVARCHAR(MAX))),
            ('LastServicedMileage', CAST(d.LastServicedMileage AS NVARCHAR(MAX)), CAST(i.LastServicedMileage AS NVARCHAR(MAX)))
        ) v(ColumnName, OldValue, NewValue)
        -- NULL-safe, case-sensitive "did it change"
        WHERE ISNULL(v.OldValue, N'<null>') COLLATE Latin1_General_BIN2
           <> ISNULL(v.NewValue, N'<null>') COLLATE Latin1_General_BIN2;
    END TRY
    BEGIN CATCH
        -- Never let auditing break the statement that fired it.
        RETURN;
    END CATCH
END
GO

-- ===================== Handy queries =====================
-- Everything that touched one car's servicing numbers, newest first:
--   SELECT a.MODIFIED_DATE, a.DB_COLUMN_NAME, a.OLD_VALUE, a.NEW_VALUE, a.MODIFIED_BY, a.UPDATED_BY_PROC
--   FROM dbo.CarAudit a WHERE a.CarNumber LIKE '%2128 FB 23%'
--     AND a.DB_COLUMN_NAME IN ('LastServicedMileage', 'CurrentMileage', 'ServicingFrequency')
--   ORDER BY a.MODIFIED_DATE DESC;
-- Who/what changed LastServicedMileage recently:
--   SELECT TOP 100 * FROM dbo.CarAudit WHERE DB_COLUMN_NAME = 'LastServicedMileage' ORDER BY MODIFIED_DATE DESC;
