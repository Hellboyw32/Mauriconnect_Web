USE [CarBooking]
GO

-- Step 1: Extend the existing Servicing table with the fields needed to record
-- the computed next-service mileage per record (kept as a historical snapshot so
-- later changes to a car's ServicingFrequency don't rewrite past history), plus
-- who created the record. ServicingFrequency itself is NOT duplicated here - it
-- already lives on Cars and is read/written there (see Step 1b).
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Servicing' AND COLUMN_NAME = 'NextServicingMileage'
)
BEGIN
    ALTER TABLE dbo.Servicing ADD NextServicingMileage INT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Servicing' AND COLUMN_NAME = 'CreatedBy'
)
BEGIN
    ALTER TABLE dbo.Servicing ADD CreatedBy VARCHAR(100) NULL;
END
GO

-- Step 1b: Clean up - an earlier version of this migration mistakenly added a
-- ServicingFrequency column directly on Servicing, duplicating Cars.ServicingFrequency.
-- Drop it; ServicingFrequency belongs on Cars only.
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Servicing' AND COLUMN_NAME = 'ServicingFrequency'
)
BEGIN
    ALTER TABLE dbo.Servicing DROP COLUMN ServicingFrequency;
END
GO

-- Step 2: Manually create a new, completed servicing record for a car (used by the
-- "Add Servicing Record" screen). This is distinct from the existing automatic
-- pending-record workflow (spCheckForServicing / spUpdateCarDetails), which is left
-- untouched. @ServicingFrequency is used to update the car's own setting and to
-- compute NextServicingMileage - it is not stored on the Servicing row itself.
CREATE OR ALTER PROCEDURE [dbo].[spAddServicingRecord]
    @CarId INT,
    @DateServiced DATETIME,
    @MileageServiced INT,
    @ServicingFrequency INT,
    @Note VARCHAR(MAX) = NULL,
    @Login VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NextServicingMileage INT = @MileageServiced + @ServicingFrequency;

    INSERT INTO dbo.Servicing
        (CarId, MileageServiced, NextServicingMileage, Note, DateServiced,
         IsCompleted, CreatedOn, CreatedBy, LastModifiedTimeStamp, LastModifiedUserId, IsDeleted)
    VALUES
        (@CarId, @MileageServiced, @NextServicingMileage, @Note, @DateServiced,
         1, GETDATE(), @Login, GETDATE(), @Login, 0);

    UPDATE dbo.Cars
    SET LastServicedMileage = @MileageServiced,
        ServicingFrequency = @ServicingFrequency
    WHERE CarId = @CarId;

    SELECT SCOPE_IDENTITY() AS ServicingId;
END
GO

-- Step 3: Servicing history, optionally filtered by car number, most recent first.
-- ServicingFrequency is read from Cars (the single source of truth), not Servicing.
CREATE OR ALTER PROCEDURE [dbo].[spGetServicingHistoryJson]
    @CarNumber VARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.ServicingId,
        s.CarId,
        s.DateServiced,
        s.MileageServiced,
        c.ServicingFrequency,
        s.NextServicingMileage,
        s.Note,
        s.CreatedBy,
        s.CreatedOn,
        s.IsCompleted,
        JSON_QUERY((
            SELECT c.CarId, c.CarNumber, c.Model
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM dbo.Servicing s
    JOIN dbo.Cars c ON c.CarId = s.CarId
    WHERE s.IsDeleted = 0
        AND (@CarNumber IS NULL OR c.CarNumber LIKE '%' + @CarNumber + '%')
    ORDER BY s.LastModifiedTimeStamp DESC
    FOR JSON PATH;
END
GO

-- Step 4: Get a single servicing record by id, for the edit screen.
-- ServicingFrequency is read from Cars (the single source of truth), not Servicing.
CREATE OR ALTER PROCEDURE [dbo].[spGetSingleServicingRecordJson]
    @ServicingId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.ServicingId,
        s.CarId,
        s.DateServiced,
        s.MileageServiced,
        c.ServicingFrequency,
        s.NextServicingMileage,
        s.Note,
        s.CreatedBy,
        s.CreatedOn,
        s.IsCompleted,
        JSON_QUERY((
            SELECT c.CarId, c.CarNumber, c.Model
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS Car
    FROM dbo.Servicing s
    JOIN dbo.Cars c ON c.CarId = s.CarId
    WHERE s.ServicingId = @ServicingId
        AND s.IsDeleted = 0
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO

-- Step 5: Edit an existing servicing record (same "record a completed service" shape
-- as spAddServicingRecord, just updating in place). @ServicingFrequency updates the
-- car's own setting and recomputes NextServicingMileage; it is not stored on Servicing.
CREATE OR ALTER PROCEDURE [dbo].[spUpdateServicingRecord]
    @ServicingId INT,
    @CarId INT,
    @DateServiced DATETIME,
    @MileageServiced INT,
    @ServicingFrequency INT,
    @Note VARCHAR(MAX) = NULL,
    @Login VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NextServicingMileage INT = @MileageServiced + @ServicingFrequency;

    UPDATE dbo.Servicing
    SET CarId = @CarId,
        DateServiced = @DateServiced,
        MileageServiced = @MileageServiced,
        NextServicingMileage = @NextServicingMileage,
        Note = @Note,
        LastModifiedTimeStamp = GETDATE(),
        LastModifiedUserId = @Login
    WHERE ServicingId = @ServicingId
        AND IsDeleted = 0;

    UPDATE dbo.Cars
    SET LastServicedMileage = @MileageServiced,
        ServicingFrequency = @ServicingFrequency
    WHERE CarId = @CarId;
END
GO
