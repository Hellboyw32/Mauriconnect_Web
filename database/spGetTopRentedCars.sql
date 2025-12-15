-- =============================================
-- Author:		Auto-generated
-- Create date: 2025-12-13
-- Description:	Get top rented cars sorted by rental count
-- =============================================
CREATE PROCEDURE [dbo].[spGetTopRentedCars]
    @TopCount INT = 8
AS  
BEGIN  
    SET NOCOUNT ON;

    SELECT TOP (@TopCount)
        c.CarId,
        c.CarNumber,
        c.Model,
        c.CurrentMileage,
        COUNT(b.BookingId) AS RentalCount
    FROM Cars c
    LEFT JOIN Bookings b ON c.CarId = b.CarId
    WHERE c.IsActive = 1
    GROUP BY c.CarId, c.CarNumber, c.Model, c.CurrentMileage
    ORDER BY COUNT(b.BookingId) DESC, c.Model ASC
    FOR JSON PATH;
END
GO
