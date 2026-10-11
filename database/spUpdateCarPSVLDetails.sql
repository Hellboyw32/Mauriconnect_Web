USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spUpdateCarPSVLDetails]
    @CarId INT,
    @StartDate DATE,
    @EndDate DATE,
    @Company NVARCHAR(200) = NULL,
    @Note NVARCHAR(MAX) = NULL,
    @Login VARCHAR(100),
    @Action VARCHAR(25),
    @PsvlId INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF @EndDate < @StartDate
        THROW 50001, 'PSVL end date must be on or after the start date.', 1;

    -- A car may only have one active PSVL: reject any overlap with another live record.
    DECLARE @Overlap INT = (
        SELECT TOP 1 PsvlId
        FROM dbo.CarPSVL
        WHERE CarId = @CarId
            AND IsActive = 1
            AND PsvlId <> ISNULL(@PsvlId, 0)
            AND StartDate <= @EndDate
            AND EndDate >= @StartDate
    );

    IF @Overlap IS NOT NULL
        THROW 50002, 'This car already has an active PSVL that overlaps these dates. Change the dates or delete the existing PSVL first.', 1;

    IF @Action = 'Add'
    BEGIN
        INSERT INTO dbo.CarPSVL
            (CarId, StartDate, EndDate, Company, Note, IsActive, LastModifiedTimeStamp, LastModifiedUserId)
        VALUES
            (@CarId, @StartDate, @EndDate, @Company, @Note, 1, GETDATE(), @Login);
    END
    ELSE IF @Action = 'Update'
    BEGIN
        UPDATE dbo.CarPSVL
        SET StartDate = @StartDate,
            EndDate = @EndDate,
            Company = @Company,
            Note = @Note,
            LastModifiedTimeStamp = GETDATE(),
            LastModifiedUserId = @Login
        WHERE PsvlId = @PsvlId
            AND CarId = @CarId;
    END
END
GO
