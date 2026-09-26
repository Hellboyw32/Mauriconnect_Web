USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spRecordLogout]
    @LoginLogId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.UserLoginLog
    SET LogoutTimeStamp = GETDATE()
    WHERE Id = @LoginLogId
        AND LogoutTimeStamp IS NULL;
END
GO
