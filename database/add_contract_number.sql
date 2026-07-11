USE [CarBooking]
GO

-- Step 1: Add ContractNumber column to Booking table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Booking' AND COLUMN_NAME = 'ContractNumber'
)
BEGIN
    ALTER TABLE dbo.Booking ADD ContractNumber varchar(100) NULL;
END
GO

-- Step 2: Update the stored procedure to include ContractNumber
ALTER Procedure [dbo].[spUpdateBookingDetails]
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
    @RoadTax datetime
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
                dbo.Booking.RoadTax = @RoadTax
            WHERE dbo.Booking.BookingId = @BookingId
            AND dbo.Booking.IsActive = 1

        -- update currentMileage for car
            DECLARE @old_Mileage int = (select CurrentMileage from cars where carId = @CarId)
            IF(@Mileage > @old_Mileage) -- only update
            BEGIN
                Update Cars set CurrentMileage = @Mileage where carId = @CarId
            END

        -- update/Insert Car Insurance
            IF EXISTS (SELECT 1 FROM [dbo].[CarInsurance] WHERE CarId = @CarId)
                BEGIN
                    DECLARE @currentInsuranceDate datetime = (select startDate from [dbo].[CarInsurance] where carid = @CarId)
                    IF CAST(@CarInsurance AS DATE) >= CAST(@currentInsuranceDate AS DATE)
                        BEGIN
                            UPDATE [dbo].[CarInsurance] SET STARTDATE = @CarInsurance WHERE carid = @CarId
                        END
                END
            ELSE
                BEGIN
                    INSERT INTO [dbo].[CarInsurance] (CarId, StartDate, LastModifiedTimeStamp, LastModifiedUserId)
                        VALUES(@CarId, @CarInsurance, getdate(), @Login)
                END

        -- update/Insert RoadTax
            IF EXISTS (SELECT 1 FROM [dbo].[RoadTax] WHERE CarId = @CarId)
                BEGIN
                    DECLARE @currentRoadTaxDate datetime = (select startDate from [dbo].[RoadTax] where carid = @CarId)
                    IF CAST(@RoadTax AS DATE) >= CAST(@currentRoadTaxDate AS DATE)
                        BEGIN
                            UPDATE [dbo].[RoadTax] SET STARTDATE = @RoadTax WHERE carid = @CarId
                        END
                END
            ELSE
                BEGIN
                    INSERT INTO [dbo].[RoadTax] (CarId, StartDate, LastModifiedTimeStamp, LastModifiedUserId)
                        VALUES(@CarId, @RoadTax, getdate(), @Login)
                END
        END
END
GO
