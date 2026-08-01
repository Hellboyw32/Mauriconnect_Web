USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spUpdateRoadTaxDetails]
    @CarId INT,
    @StartDate DATETIME,
    @EndDate DATETIME,
    @Note NVARCHAR(MAX),
    @Login VARCHAR(100),
    @Action VARCHAR(25),
    @RoadTaxId INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;

    IF @Action = 'Add'
    BEGIN
        INSERT INTO dbo.RoadTax
            (CarId, StartDate, EndDate, Note, IsActive, LastModifiedTimeStamp, LastModifiedUserId)
        VALUES
            (@CarId, @StartDate, @EndDate, @Note, 1, GETDATE(), @Login);
    END
    ELSE IF @Action = 'Update'
    BEGIN
        UPDATE dbo.RoadTax
        SET CarId = @CarId,
            StartDate = @StartDate,
            EndDate = @EndDate,
            Note = @Note,
            IsActive = @IsActive,
            LastModifiedTimeStamp = GETDATE(),
            LastModifiedUserId = @Login
        WHERE RoadTaxId = @RoadTaxId;
    END
END
GO
