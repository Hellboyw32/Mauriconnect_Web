USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spInsertAuditLog]
    @UserId INT,
    @Username VARCHAR(100),
    @Action VARCHAR(100),
    @EntityType VARCHAR(100),
    @EntityId VARCHAR(100) = NULL,
    @Description VARCHAR(500) = NULL,
    @IPAddress VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.AuditLog (UserId, Username, Action, EntityType, EntityId, Description, Timestamp, IPAddress)
    VALUES (@UserId, @Username, @Action, @EntityType, @EntityId, @Description, GETDATE(), @IPAddress);
END
GO
