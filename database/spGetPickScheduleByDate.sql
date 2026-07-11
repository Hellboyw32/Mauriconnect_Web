USE [CarBooking]
GO
/****** Object:  StoredProcedure [dbo].[spGetPickScheduleByDate]    Script Date: 11/07/2026 09:44:55 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER Procedure [dbo].[spGetPickScheduleByDate]
(
@pickupdate datetime
)
AS
BEGIN

	select b.BookingId,CONCAT(b.CustomerName,' - ',b.ReferenceNo) as CustomerName,b.ContactDetails, isnull(b.FlightNo, '') as FlightNo, b.PickUpDate, b.DropOffDate, b.NumberOfDays,
	CASE	WHEN b.Price NOT LIKE '%EUR%' AND b.Price NOT LIKE '%MUR%' THEN CONCAT(b.Currency, ' ', b.Price)ELSE b.Price END as Price,
	isnull(b.IsBoosterSeat,0) as IsBoosterSeat, isnull(b.IsCarSeat,0) as IsCarSeat, isnull(b.IsGps, 0 ) as IsGps,
	b.CarId, c.CategoryId, isnull(b.SpecialRequest, '') as SpecialRequest ,b.LastModifiedUserId, CONCAT(c.CarNumber, ' - ',c.Model) as CarNumber, cc.Category as Category,
	isnull(b.DropOffPlace, '') as DropOffPlace, isnull(b.PickupLocation, '') as PickupLocation, isnull(b.IsBoosterSeat, 0) as BoosterSeat, isnull(b.IsCarSeat, 0) as CarSeat, isnull(b.IsGps,0) as Gps, isnull(b.HasInsurance, 0) as HasInsurance, b.FuelLevel  from Booking b inner join cars c
	on b.CarId = c.CarId
	inner join  CarCategory cc
	on cc.CategoryId = c.CategoryId
	where CAST(PickUpDate AS date) =  CAST(@pickupdate AS date)  and b.IsActive = 1
	order by b.PickUpDate asc

END
