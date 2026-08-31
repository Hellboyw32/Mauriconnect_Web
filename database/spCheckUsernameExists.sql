USE [CarBooking]
GO

CREATE OR ALTER PROCEDURE [dbo].[spCheckUsernameExists]
    @Username VARCHAR(100),
    @ExcludeUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM dbo.Users
        WHERE Username = @Username
            AND (@ExcludeUserId IS NULL OR UserId <> @ExcludeUserId)
    ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS UsernameExists
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO
