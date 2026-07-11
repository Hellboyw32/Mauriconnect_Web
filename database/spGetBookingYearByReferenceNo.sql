USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetBookingYearByReferenceNo]
    @ReferenceNo NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 YEAR(CreatedOn) AS BookingYear
    FROM Booking
    WHERE ReferenceNo = @ReferenceNo
    ORDER BY CreatedOn DESC;
END
GO
