USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetSimCardReportByDate]
    @StartDate DATETIME,
    @EndDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        b.CreatedBy AS AgentName,
        SUM(b.SimCard) AS SimCardCount
    FROM Booking b
    WHERE b.IsActive = 1
        AND b.SimCard IS NOT NULL
        AND b.SimCard > 0
        AND CAST(b.PickUpDate AS DATE) BETWEEN CAST(@StartDate AS DATE) AND CAST(@EndDate AS DATE)
    GROUP BY b.CreatedBy
    ORDER BY SimCardCount DESC
END
GO
