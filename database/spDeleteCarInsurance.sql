USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spDeleteCarInsurance]
    @CarInsuranceId INT,
    @Login VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.CarInsurance
    SET IsActive = 0,
        LastModifiedTimeStamp = GETDATE(),
        LastModifiedUserId = @Login
    WHERE CarInsuranceId = @CarInsuranceId;
END
GO
