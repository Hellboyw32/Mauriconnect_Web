USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Settlement report for the bookings PICKED UP on @PickupDate, laid out like the
-- paper settlement sheet the agents fill in:
--   Client Name | CarNo | Model | DropOffDate | D.Off Time | Amount | PayMode | Agent | Remarks
--
-- Unlike the older spGetSettlementByDate (which is left untouched), this lists
-- EVERY active booking of the day, including No Shows and bookings with no car
-- assigned yet (LEFT JOIN), because the sheet has a line for each of them.
--
--   CarNo    : the car number; "No Show" for a no-show booking
--   Amount   : the price, or "Already Paid" when the booking was prepaid
--   PayMode  : card -> the POS machine used (e.g. "Tan & Tej"), cash -> "Cash",
--              already paid -> "-"
--   Agent    : the delivery / sale agent
--   Remarks  : "FC <amount>" when full-cover insurance was taken (as the agents
--              write it on the sheet)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spGetSettlementReportByDate]
    @PickupDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        b.BookingId,
        -- some names were pasted with tab characters
        LTRIM(RTRIM(REPLACE(ISNULL(b.CustomerName, ''), CHAR(9), ''))) AS ClientName,
        CASE WHEN b.NoShow = 1 THEN 'No Show' ELSE LTRIM(RTRIM(ISNULL(c.CarNumber, ''))) END AS CarNo,
        LTRIM(RTRIM(ISNULL(c.Model, ''))) AS Model,
        CAST(b.DropOffDate AS DATE) AS DropOffDate,
        CONVERT(VARCHAR(5), b.DropOffDate, 108) AS DropOffTime,
        -- PaymentMethod holds legacy truncated variants ("AlreadyPai", "Already Pa")
        CASE
            WHEN b.PaymentMethod LIKE 'Already%' THEN 'Already Paid'
            ELSE LTRIM(RTRIM(ISNULL(b.Price, '')))
        END AS Amount,
        CASE
            WHEN b.NoShow = 1 THEN ''
            WHEN b.PaymentMethod LIKE 'Already%' THEN '-'
            WHEN b.PaymentMethod = 'Card'
                THEN ISNULL(NULLIF(LTRIM(RTRIM(b.POSMachine)), ''), 'Card')
            ELSE ISNULL(LTRIM(RTRIM(b.PaymentMethod)), '')
        END AS PayMode,
        ISNULL(d.[Name], '') AS Agent,
        CASE
            WHEN b.HasInsurance = 1 AND ISNULL(b.InsuranceAmount, 0) > 1
                THEN 'FC ' + FORMAT(b.InsuranceAmount, 'N0')
            WHEN b.HasInsurance = 1 THEN 'FC'
            ELSE ''
        END AS Remarks
    FROM dbo.Booking b
    LEFT JOIN dbo.Cars c ON c.CarId = b.CarId
    -- DeliveryUser is stored as text; TRY_CAST keeps one bad value from failing the report
    LEFT JOIN dbo.DeliveryUsers d ON d.DeliveryUserId = TRY_CAST(b.DeliveryUser AS INT)
    WHERE b.IsActive = 1
        AND CAST(b.PickUpDate AS DATE) = @PickupDate
    ORDER BY b.PickUpDate, b.BookingId;
END
GO
