-- Fix 1: spUpdateBookingDetails was missing the @PickupLocation parameter that
-- api/src/services/booking.ts already sends on every update, causing
-- "Procedure or function spUpdateBookingDetails has too many arguments specified."
-- on every booking edit. PickupLocation was added to the Booking table and to
-- spAddBookingDetails (create flow) via add_pickup_location.sql, but the update
-- flow was never updated to match.
-- Fix 2: the CarInsurance/RoadTax "current record" subqueries used a plain
-- `WHERE CarId = @CarId` with no row-limiting, which throws "Subquery returned
-- more than 1 value" for any car with more than one history row (confirmed live,
-- e.g. RoadTax CarId 1833 has two IsActive=1 rows). Now selects the most recent
-- active row deterministically via TOP 1 ... ORDER BY StartDate DESC, and the
-- follow-up UPDATE targets that row by primary key instead of by CarId, so it
-- can no longer touch every history row for the car.
-- Everything else in this procedure is unchanged from the live definition
-- (includes the earlier @Mileage NULL fix).
CREATE OR ALTER Procedure [dbo].[spUpdateBookingDetails]
(
    @CustomerName varchar(200),
    @ContractNumber varchar(100),
    @ContactDetails varchar(100),
    @FlightNo varchar(100),
    @PickUpDate datetime,
    @DropOffDate datetime,
    @NumberOfDays int,
    @Price varchar(50),
    @CarId int,
    @SpecialRequest varchar(300),
    @Login varchar(100),
    @Action varchar(25),
    @BookingId int,
    @ReferenceNo varchar(100),
    @NoShow bit,
    @Mileage int,
    @Insurance varchar(100),
    @Currency varchar(20),
    @PaymentMethod varchar(25),
    @POSMachine varchar(50),
    @IsGPS bit,
    @IsCarSeat bit,
    @IsBoosterSeat bit,
    @DropOffPlace varchar(max),
    @DeliveryUser varchar(255),
    @InsuranceAmount varchar(50),
    @SimCard varchar(50),
    @HasInsurance bit,
    @FuelLevel varchar(50),
    @CarInsurance datetime,
    @RoadTax datetime,
    @PickupLocation varchar(max) = NULL
)

AS
BEGIN
    IF @Action = 'Add'
        BEGIN
            INSERT INTO dbo.Booking
            (
                CustomerName,
                ContractNumber,
                ContactDetails,
                PickUpDate,
                DropOffDate,
                FlightNo,
                NumberOfDays,
                CarId,
                SpecialRequest,
                Price,
                IsActive,
                CreatedOn,
                CreatedBy,
                LastModifiedTimeStamp,
                LastModifiedUserId,
                ReferenceNo,
                NoShow
            )
            VALUES
            (
                @CustomerName,
                @ContractNumber,
                @ContactDetails,
                @PickUpDate,
                @DropOffDate,
                @FlightNo,
                @NumberOfDays,
                @CarId,
                @SpecialRequest,
                @Price,
                1,
                getdate(),
                @Login,
                GETDATE(),
                @Login,
                @ReferenceNo,
                @NoShow
            )
        END
    ELSE IF @Action = 'Update'
        BEGIN
            UPDATE dbo.Booking
            SET dbo.Booking.CustomerName = @CustomerName,
                dbo.Booking.ContractNumber = @ContractNumber,
                dbo.Booking.ContactDetails = @ContactDetails,
                dbo.Booking.PickUpDate = @PickUpDate,
                dbo.Booking.DropOffDate = @DropOffDate,
                dbo.Booking.FlightNo = @FlightNo,
                dbo.Booking.NumberOfDays = @NumberOfDays,
                dbo.Booking.CarId = @CarId,
                dbo.Booking.SpecialRequest = @SpecialRequest,
                dbo.Booking.Price = @Price,
                dbo.Booking.LastModifiedTimeStamp = getdate(),
                dbo.Booking.LastModifiedUserId = @Login,
                dbo.Booking.ReferenceNo = @ReferenceNo,
                dbo.Booking.NoShow = @NoShow,
                dbo.Booking.Mileage = @Mileage,
                dbo.Booking.Insurance = @Insurance,
                dbo.Booking.Currency = @Currency,
                dbo.Booking.PaymentMethod = @PaymentMethod,
                dbo.Booking.POSMachine = @POSMachine,
                dbo.Booking.IsGPS = @IsGPS,
                dbo.Booking.IsCarSeat = @IsCarSeat,
                dbo.Booking.IsBoosterSeat = @IsBoosterSeat,
                dbo.Booking.DropOffPlace = @DropOffPlace,
                dbo.Booking.DeliveryUser = @DeliveryUser,
                dbo.Booking.InsuranceAmount = @InsuranceAmount,
                dbo.Booking.SimCard = @SimCard,
                dbo.Booking.HasInsurance = @HasInsurance,
                dbo.Booking.FuelLevel = @FuelLevel,
                dbo.Booking.CarInsurance = @CarInsurance,
                dbo.Booking.RoadTax = @RoadTax,
                dbo.Booking.PickupLocation = @PickupLocation
            WHERE dbo.Booking.BookingId = @BookingId
            AND dbo.Booking.IsActive = 1

        -- update currentMileage for car - the only place a car's mileage is updated
        -- (when the car is returned and the agent records the odometer reading).
        -- The client already blocks submitting a mileage lower than the car's current
        -- mileage; this check is a backend backstop and also handles cars that have
        -- never had a mileage recorded (CurrentMileage IS NULL).
            DECLARE @old_Mileage int = (select CurrentMileage from cars where carId = @CarId)
            IF(@Mileage > ISNULL(@old_Mileage, -1)) -- only update forward
            BEGIN
                Update Cars set CurrentMileage = @Mileage where carId = @CarId
            END

        -- update/Insert Car Insurance
        -- Cars can have multiple CarInsurance history rows; pick the current active
        -- one deterministically (most recent StartDate) instead of a plain subquery,
        -- which throws "Subquery returned more than 1 value" once a car has more
        -- than one row. Target the UPDATE by primary key so only that row changes.
            IF EXISTS (SELECT 1 FROM [dbo].[CarInsurance] WHERE CarId = @CarId AND IsActive = 1)
                BEGIN
                    DECLARE @currentInsuranceId int, @currentInsuranceDate datetime
                    SELECT TOP 1 @currentInsuranceId = CarInsuranceId, @currentInsuranceDate = StartDate
                    FROM [dbo].[CarInsurance]
                    WHERE CarId = @CarId AND IsActive = 1
                    ORDER BY StartDate DESC, CarInsuranceId DESC

                    IF CAST(@CarInsurance AS DATE) >= CAST(@currentInsuranceDate AS DATE)
                        BEGIN
                            UPDATE [dbo].[CarInsurance] SET STARTDATE = @CarInsurance WHERE CarInsuranceId = @currentInsuranceId
                        END
                END
            ELSE
                BEGIN
                    INSERT INTO [dbo].[CarInsurance] (CarId, StartDate, LastModifiedTimeStamp, LastModifiedUserId)
                        VALUES(@CarId, @CarInsurance, getdate(), @Login)
                END

        -- update/Insert RoadTax (same duplicate-row fix as CarInsurance above)
            IF EXISTS (SELECT 1 FROM [dbo].[RoadTax] WHERE CarId = @CarId AND IsActive = 1)
                BEGIN
                    DECLARE @currentRoadTaxId int, @currentRoadTaxDate datetime
                    SELECT TOP 1 @currentRoadTaxId = RoadTaxId, @currentRoadTaxDate = StartDate
                    FROM [dbo].[RoadTax]
                    WHERE CarId = @CarId AND IsActive = 1
                    ORDER BY StartDate DESC, RoadTaxId DESC

                    IF CAST(@RoadTax AS DATE) >= CAST(@currentRoadTaxDate AS DATE)
                        BEGIN
                            UPDATE [dbo].[RoadTax] SET STARTDATE = @RoadTax WHERE RoadTaxId = @currentRoadTaxId
                        END
                END
            ELSE
                BEGIN
                    INSERT INTO [dbo].[RoadTax] (CarId, StartDate, LastModifiedTimeStamp, LastModifiedUserId)
                        VALUES(@CarId, @RoadTax, getdate(), @Login)
                END
        END
END
