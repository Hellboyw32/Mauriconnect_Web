USE [CarBooking]
GO

-- Cars that currently have a pending servicing record
-- (not completed, not deleted). Read-only: no data is changed.
-- Outsource placeholder cars are excluded, matching the dashboard scheduler.
SELECT
    c.CarId,
    c.CarNumber,
    c.Model,
    cc.Category                           AS CategoryName,
    c.CurrentMileage,
    c.LastServicedMileage,
    c.ServicingFrequency,
    s.ServicingId,
    s.CreatedOn                           AS PendingSince,
    DATEDIFF(DAY, s.CreatedOn, GETDATE()) AS DaysPending
FROM dbo.Servicing s
JOIN dbo.Cars c ON c.CarId = s.CarId
LEFT JOIN dbo.CarCategory cc ON cc.CategoryId = c.CategoryId
WHERE s.IsCompleted = 0
  AND s.IsDeleted = 0
  AND c.IsActive = 1
  AND c.CarNumber NOT LIKE '%Outsource%'
ORDER BY s.CreatedOn;   -- longest-waiting first
GO
