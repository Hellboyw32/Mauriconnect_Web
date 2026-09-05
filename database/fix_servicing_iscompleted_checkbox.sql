USE [CarBooking]
GO

-- Let the Add/Edit Servicing screen set IsCompleted directly via a "Servicing done"
-- checkbox, instead of it only ever being fixed at 1 (spAddServicingRecord) or left
-- untouched (spUpdateServicingRecord). This is what lets an agent open one of the
-- auto-created "pending due" records (see fix_booking_return_servicing_trigger.sql,
-- inserted with IsCompleted = 0), fill in the actual service details, tick the
-- checkbox, and have Update flip it to Completed.
CREATE OR ALTER PROCEDURE [dbo].[spAddServicingRecord]
    @CarId INT,
    @DateServiced DATETIME,
    @MileageServiced INT,
    @ServicingFrequency INT,
    @Note VARCHAR(MAX) = NULL,
    @Login VARCHAR(100),
    @IsCompleted BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NextServicingMileage INT = @MileageServiced + @ServicingFrequency;

    INSERT INTO dbo.Servicing
        (CarId, MileageServiced, NextServicingMileage, Note, DateServiced,
         IsCompleted, CreatedOn, CreatedBy, LastModifiedTimeStamp, LastModifiedUserId, IsDeleted)
    VALUES
        (@CarId, @MileageServiced, @NextServicingMileage, @Note, @DateServiced,
         @IsCompleted, GETDATE(), @Login, GETDATE(), @Login, 0);

    UPDATE dbo.Cars
    SET LastServicedMileage = @MileageServiced,
        ServicingFrequency = @ServicingFrequency
    WHERE CarId = @CarId;

    SELECT SCOPE_IDENTITY() AS ServicingId;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[spUpdateServicingRecord]
    @ServicingId INT,
    @CarId INT,
    @DateServiced DATETIME,
    @MileageServiced INT,
    @ServicingFrequency INT,
    @Note VARCHAR(MAX) = NULL,
    @Login VARCHAR(100),
    @IsCompleted BIT = 0
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
        IsCompleted = @IsCompleted,
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
