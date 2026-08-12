USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spUpdateCarInsuranceDetails]
    @CarId INT,
    @StartDate DATETIME,
    @EndDate DATETIME,
    @Note NVARCHAR(MAX),
    @Login VARCHAR(100),
    @Action VARCHAR(25),
    @CarInsuranceId INT,
    @IsActive BIT,
    @PolicyNumber NVARCHAR(50) = NULL,
    @Insurer NVARCHAR(200) = NULL,
    @CoverageType NVARCHAR(100) = NULL,
    @Premium DECIMAL(12,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Action = 'Add'
    BEGIN
        INSERT INTO dbo.CarInsurance
            (CarId, StartDate, EndDate, Note, PolicyNumber, Insurer, CoverageType, Premium, IsActive, LastModifiedTimeStamp, LastModifiedUserId)
        VALUES
            (@CarId, @StartDate, @EndDate, @Note, @PolicyNumber, @Insurer, @CoverageType, @Premium, 1, GETDATE(), @Login);
    END
    ELSE IF @Action = 'Update'
    BEGIN
        UPDATE dbo.CarInsurance
        SET CarId = @CarId,
            StartDate = @StartDate,
            EndDate = @EndDate,
            Note = @Note,
            PolicyNumber = @PolicyNumber,
            Insurer = @Insurer,
            CoverageType = @CoverageType,
            Premium = @Premium,
            IsActive = @IsActive,
            LastModifiedTimeStamp = GETDATE(),
            LastModifiedUserId = @Login
        WHERE CarInsuranceId = @CarInsuranceId;
    END
END
GO
