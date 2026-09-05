USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spUpdateFitnessCertificateDetails]
    @CarId INT,
    @StartDate DATETIME,
    @EndDate DATETIME,
    @Note NVARCHAR(MAX),
    @Login VARCHAR(100),
    @Action VARCHAR(25),
    @FitnessId INT,
    @IsActive BIT,
    @CertificateNumber NVARCHAR(50) = NULL,
    @IssuedBy NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Action = 'Add'
    BEGIN
        INSERT INTO dbo.CarFitness
            (CarId, StartDate, EndDate, Note, CertificateNumber, IssuedBy, IsActive, LastModifiedTimeStamp, LastModifiedUserId)
        VALUES
            (@CarId, @StartDate, @EndDate, @Note, @CertificateNumber, @IssuedBy, 1, GETDATE(), @Login);
    END
    ELSE IF @Action = 'Update'
    BEGIN
        UPDATE dbo.CarFitness
        SET CarId = @CarId,
            StartDate = @StartDate,
            EndDate = @EndDate,
            Note = @Note,
            CertificateNumber = @CertificateNumber,
            IssuedBy = @IssuedBy,
            IsActive = @IsActive,
            LastModifiedTimeStamp = GETDATE(),
            LastModifiedUserId = @Login
        WHERE FitnessId = @FitnessId;
    END
END
GO
