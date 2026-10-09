USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spInsertAppLogError]
    @ErrorCategory VARCHAR(30),
    @Severity VARCHAR(10) = 'Error',
    @Source VARCHAR(10) = 'Api',
    @ErrorCode VARCHAR(100) = NULL,
    @ErrorMessage NVARCHAR(MAX),
    @StackTrace NVARCHAR(MAX) = NULL,
    @HttpMethod VARCHAR(10) = NULL,
    @RequestUrl VARCHAR(2000) = NULL,
    @StatusCode INT = NULL,
    @RequestBody NVARCHAR(MAX) = NULL,
    @ComponentName VARCHAR(200) = NULL,
    @UserId INT = NULL,
    @Username VARCHAR(100) = NULL,
    @IPAddress VARCHAR(50) = NULL,
    @UserAgent VARCHAR(500) = NULL,
    @Environment VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.AppLogError (
        ErrorCategory, Severity, Source, ErrorCode, ErrorMessage, StackTrace,
        HttpMethod, RequestUrl, StatusCode, RequestBody, ComponentName,
        UserId, Username, IPAddress, UserAgent, Environment
    )
    VALUES (
        @ErrorCategory, @Severity, @Source, @ErrorCode, @ErrorMessage, @StackTrace,
        @HttpMethod, @RequestUrl, @StatusCode, @RequestBody, @ComponentName,
        @UserId, @Username, @IPAddress, @UserAgent, @Environment
    );
END
GO
