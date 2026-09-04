USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spGetInsuranceReportByDate]
    @StartDate DATETIME,
    @EndDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        du.Name AS DeliveryAgentName,
        SUM(TRY_CAST(b.Insurance AS DECIMAL(18, 2))) AS TotalInsurance
    FROM Booking b
    INNER JOIN DeliveryUsers du ON du.DeliveryUserId = TRY_CAST(b.DeliveryUser AS INT)
    WHERE b.IsActive = 1
        AND ISNULL(b.HasInsurance, 0) = 0
        AND b.DeliveryUser IS NOT NULL
        AND TRY_CAST(b.Insurance AS DECIMAL(18, 2)) IS NOT NULL
        AND CAST(b.PickUpDate AS DATE) BETWEEN CAST(@StartDate AS DATE) AND CAST(@EndDate AS DATE)
    GROUP BY du.Name
    ORDER BY TotalInsurance DESC
END
GO
