SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
/*
  Stored procedures and triggers. Repeatable: every object uses CREATE OR ALTER,
  and the migration runner re-applies this file whenever its checksum changes.
*/

/* ---------- Guards ---------- */

-- Last line of defence: a physical car can never hold two overlapping blocking bookings,
-- whatever code path (website, admin, manual SQL) writes the row.
CREATE OR ALTER TRIGGER rental.trg_Bookings_NoOverlap ON rental.Bookings
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted WHERE CarId IS NOT NULL) RETURN;

    DECLARE @now datetime2(0) = SYSUTCDATETIME();

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN rental.Bookings b
          ON b.CarId = i.CarId
         AND b.BookingId <> i.BookingId
         AND b.PickupDateTimeUtc < i.ReturnDateTimeUtc
         AND b.ReturnDateTimeUtc > i.PickupDateTimeUtc
        WHERE (i.BookingStatus IN ('Confirmed', 'InProgress') OR (i.BookingStatus = 'PendingPayment' AND i.HoldExpiresAtUtc > @now))
          AND (b.BookingStatus IN ('Confirmed', 'InProgress') OR (b.BookingStatus = 'PendingPayment' AND b.HoldExpiresAtUtc > @now))
    )
        THROW 50010, 'CAR_DOUBLE_BOOKED', 1;
END;
GO

CREATE OR ALTER TRIGGER rental.trg_CarPricing_NoOverlap ON rental.CarPricing
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN rental.CarPricing p
          ON p.CarModelId = i.CarModelId
         AND p.PricingId <> i.PricingId
         AND p.IsActive = 1
         AND i.IsActive = 1
         AND p.RangeStart <= i.RangeEnd
         AND p.RangeEnd >= i.RangeStart
    )
        THROW 50020, 'PRICING_RANGE_OVERLAP', 1;
END;
GO

/* ---------- Helpers ---------- */

CREATE OR ALTER FUNCTION rental.fn_SettingInt (@Key varchar(50), @Default int)
RETURNS int
AS
BEGIN
    RETURN ISNULL((SELECT TRY_CONVERT(int, SettingValue) FROM rental.Settings WHERE SettingKey = @Key), @Default);
END;
GO

-- Serialises booking work per car model for the current transaction.
CREATE OR ALTER PROCEDURE rental.usp_LockCarModel
    @CarModelId int
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @resource nvarchar(255) = N'rental-carmodel-' + CAST(@CarModelId AS nvarchar(20));
    DECLARE @rc int;
    EXEC @rc = sp_getapplock @Resource = @resource, @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 15000;
    IF @rc < 0 THROW 50002, 'BOOKING_LOCK_TIMEOUT', 1;
END;
GO

-- Picks a free physical car of the model for the period, or NULL when the fleet is full.
-- Must run inside a transaction that already holds usp_LockCarModel.
CREATE OR ALTER PROCEDURE rental.usp_AssignCar
    @CarModelId       int,
    @PickupUtc        datetime2(0),
    @ReturnUtc        datetime2(0),
    @ExcludeBookingId int = NULL,
    @CarId            int OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @turnaround int = rental.fn_SettingInt('TurnaroundMinutes', 0);
    DECLARE @now datetime2(0) = SYSUTCDATETIME();
    SET @CarId = NULL;

    -- Best fit: prefer the car whose previous rental ends closest before this pickup.
    SELECT TOP (1) @CarId = c.CarId
    FROM rental.Cars c
    WHERE c.CarModelId = @CarModelId
      AND c.IsActive = 1
      AND NOT EXISTS (
          SELECT 1
          FROM rental.Bookings b WITH (UPDLOCK, HOLDLOCK)
          WHERE b.CarId = c.CarId
            AND (@ExcludeBookingId IS NULL OR b.BookingId <> @ExcludeBookingId)
            AND b.PickupDateTimeUtc < DATEADD(MINUTE, @turnaround, @ReturnUtc)
            AND b.ReturnDateTimeUtc > DATEADD(MINUTE, -@turnaround, @PickupUtc)
            AND (b.BookingStatus IN ('Confirmed', 'InProgress')
                 OR (b.BookingStatus = 'PendingPayment' AND b.HoldExpiresAtUtc > @now)))
    ORDER BY (SELECT MAX(p.ReturnDateTimeUtc)
              FROM rental.Bookings p
              WHERE p.CarId = c.CarId
                AND p.ReturnDateTimeUtc <= @PickupUtc
                AND p.BookingStatus IN ('Confirmed', 'InProgress', 'Completed')) DESC,
             c.CarId;
END;
GO

/* ---------- Search ---------- */

-- Active models with their count of free cars for the period (informational: the business
-- sells outsourced cars when the fleet is full).
CREATE OR ALTER PROCEDURE rental.usp_SearchAvailableModels
    @PickupUtc datetime2(0),
    @ReturnUtc datetime2(0)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @turnaround int = rental.fn_SettingInt('TurnaroundMinutes', 0);
    DECLARE @now datetime2(0) = SYSUTCDATETIME();

    SELECT m.CarModelId, m.Slug, m.ModelName, m.Description, m.Transmission, m.FuelType,
           m.PassengerCapacity, m.DoorCount, m.LuggageCapacity, m.HasAirConditioning,
           m.ImageUrl, m.SecurityDeposit, m.DisplayOrder,
           cat.CategoryName, cat.Slug AS CategorySlug, cat.DisplayOrder AS CategoryOrder,
           (SELECT COUNT(*)
            FROM rental.Cars c
            WHERE c.CarModelId = m.CarModelId
              AND c.IsActive = 1
              AND NOT EXISTS (
                  SELECT 1 FROM rental.Bookings b
                  WHERE b.CarId = c.CarId
                    AND b.PickupDateTimeUtc < DATEADD(MINUTE, @turnaround, @ReturnUtc)
                    AND b.ReturnDateTimeUtc > DATEADD(MINUTE, -@turnaround, @PickupUtc)
                    AND (b.BookingStatus IN ('Confirmed', 'InProgress')
                         OR (b.BookingStatus = 'PendingPayment' AND b.HoldExpiresAtUtc > @now)))) AS FreeUnits
    FROM rental.CarModels m
    JOIN rental.CarCategories cat ON cat.CarCategoryId = m.CarCategoryId
    WHERE m.IsActive = 1 AND cat.IsActive = 1
    ORDER BY cat.DisplayOrder, m.DisplayOrder, m.ModelName;
END;
GO

-- Active pricing ranges touching the date span, for the given models (comma separated ids).
CREATE OR ALTER PROCEDURE rental.usp_GetPricingRanges
    @FromDate    date,
    @ToDate      date,
    @CarModelIds varchar(max)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.CarModelId, p.RangeStart, p.RangeEnd, p.DailyRate
    FROM rental.CarPricing p
    JOIN STRING_SPLIT(@CarModelIds, ',') ids ON TRY_CONVERT(int, ids.value) = p.CarModelId
    WHERE p.IsActive = 1
      AND p.RangeStart <= @ToDate
      AND p.RangeEnd >= @FromDate
    ORDER BY p.CarModelId, p.RangeStart;

    SELECT d.CarModelId, d.MinDays, d.PercentOff
    FROM rental.DurationDiscounts d
    WHERE d.IsActive = 1
      AND (d.CarModelId IS NULL OR d.CarModelId IN (SELECT TRY_CONVERT(int, value) FROM STRING_SPLIT(@CarModelIds, ',')));
END;
GO

/* ---------- Booking lifecycle ---------- */

CREATE OR ALTER PROCEDURE rental.usp_CreateBooking
    @BookingReference     char(14),
    @IdempotencyKey       varchar(64) = NULL,
    @FirstName            nvarchar(100),
    @LastName             nvarchar(100),
    @Email                nvarchar(254),
    @MobileNumber         varchar(20),
    @Country              char(2),
    @Nationality          char(2),
    @Address              nvarchar(300),
    @City                 nvarchar(100),
    @PostalCode           nvarchar(20),
    @DrivingLicenceNumber nvarchar(50) = NULL,
    @CarModelId           int,
    @PickupLocationId     int,
    @ReturnLocationId     int,
    @PickupAddress        nvarchar(300) = NULL,
    @ReturnAddress        nvarchar(300) = NULL,
    @PickupUtc            datetime2(0),
    @ReturnUtc            datetime2(0),
    @RentalDays           smallint,
    @SubTotal             decimal(10,2),
    @AdditionalCharges    decimal(10,2),
    @TotalAmount          decimal(10,2),
    @SecurityDeposit      decimal(10,2) = NULL,
    @FlightNumber         nvarchar(20) = NULL,
    @ArrivalUtc           datetime2(0) = NULL,
    @Accommodation        nvarchar(200) = NULL,
    @SpecialRequests      nvarchar(1000) = NULL,
    @ChargesJson          nvarchar(max),
    @IpAddress            varchar(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @IdempotencyKey IS NOT NULL
    BEGIN
        DECLARE @existing char(14) = (SELECT BookingReference FROM rental.Bookings WHERE IdempotencyKey = @IdempotencyKey);
        IF @existing IS NOT NULL
        BEGIN
            SELECT b.BookingReference, b.IsOutsourced, b.HoldExpiresAtUtc, CAST(1 AS bit) AS IsExisting
            FROM rental.Bookings b WHERE b.BookingReference = @existing;
            RETURN;
        END
    END

    DECLARE @holdMinutes int = rental.fn_SettingInt('HoldMinutes', 30);
    DECLARE @carId int;
    DECLARE @customerId int;
    DECLARE @bookingId int;

    BEGIN TRANSACTION;

    EXEC rental.usp_LockCarModel @CarModelId;
    EXEC rental.usp_AssignCar @CarModelId, @PickupUtc, @ReturnUtc, NULL, @CarId = @carId OUTPUT;

    INSERT INTO rental.Customers (FirstName, LastName, Email, MobileNumber, Country, Nationality, Address, City, PostalCode, DrivingLicenceNumber)
    VALUES (@FirstName, @LastName, @Email, @MobileNumber, @Country, @Nationality, @Address, @City, @PostalCode, @DrivingLicenceNumber);
    SET @customerId = SCOPE_IDENTITY();

    INSERT INTO rental.Bookings (
        BookingReference, CustomerId, CarModelId, CarId, IsOutsourced,
        PickupLocationId, ReturnLocationId, PickupAddress, ReturnAddress,
        PickupDateTimeUtc, ReturnDateTimeUtc, RentalDays,
        SubTotal, AdditionalCharges, TotalAmount, SecurityDeposit, Currency,
        BookingStatus, PaymentStatus, HoldExpiresAtUtc,
        FlightNumber, ArrivalDateTimeUtc, Accommodation, SpecialRequests, IdempotencyKey)
    VALUES (
        @BookingReference, @customerId, @CarModelId, @carId, CASE WHEN @carId IS NULL THEN 1 ELSE 0 END,
        @PickupLocationId, @ReturnLocationId, @PickupAddress, @ReturnAddress,
        @PickupUtc, @ReturnUtc, @RentalDays,
        @SubTotal, @AdditionalCharges, @TotalAmount, @SecurityDeposit, 'EUR',
        'PendingPayment', 'Pending', DATEADD(MINUTE, @holdMinutes, SYSUTCDATETIME()),
        @FlightNumber, @ArrivalUtc, @Accommodation, @SpecialRequests, @IdempotencyKey);
    SET @bookingId = SCOPE_IDENTITY();

    INSERT INTO rental.BookingCharges (BookingId, ChargeType, ExtraId, Description, Quantity, Amount, SortOrder)
    SELECT @bookingId, j.ChargeType, j.ExtraId, j.Description, ISNULL(j.Quantity, 1), j.Amount, j.SortOrder
    FROM OPENJSON(@ChargesJson)
         WITH (ChargeType varchar(20) '$.type',
               ExtraId int '$.extraId',
               Description nvarchar(200) '$.description',
               Quantity smallint '$.quantity',
               Amount decimal(10,2) '$.amount',
               SortOrder int '$.sortOrder') j;

    IF (SELECT ISNULL(SUM(Amount), 0) FROM rental.BookingCharges WHERE BookingId = @bookingId) <> @TotalAmount
        THROW 50003, 'CHARGES_TOTAL_MISMATCH', 1;

    INSERT INTO rental.BookingAuditLog (BookingId, Action, OldStatus, NewStatus, Actor, IpAddress, Description)
    VALUES (@bookingId, 'Created', NULL, 'PendingPayment', 'customer', @IpAddress,
            CASE WHEN @carId IS NULL THEN N'No fleet car free: booking marked for an outsourced car.'
                 ELSE N'Car held until payment.' END);

    COMMIT TRANSACTION;

    SELECT b.BookingReference, b.IsOutsourced, b.HoldExpiresAtUtc, CAST(0 AS bit) AS IsExisting
    FROM rental.Bookings b WHERE b.BookingId = @bookingId;
END;
GO

-- Renews the hold of an unpaid booking (e.g. when payment restarts after the hold expired).
CREATE OR ALTER PROCEDURE rental.usp_RenewHold
    @BookingId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @modelId int, @status varchar(20), @hold datetime2(0), @pickup datetime2(0), @return datetime2(0), @carId int;
    SELECT @modelId = CarModelId FROM rental.Bookings WHERE BookingId = @BookingId;
    IF @modelId IS NULL THROW 50004, 'BOOKING_NOT_FOUND', 1;

    BEGIN TRANSACTION;
    EXEC rental.usp_LockCarModel @modelId;

    SELECT @status = BookingStatus, @hold = HoldExpiresAtUtc, @pickup = PickupDateTimeUtc, @return = ReturnDateTimeUtc
    FROM rental.Bookings WITH (UPDLOCK, HOLDLOCK) WHERE BookingId = @BookingId;

    IF @status NOT IN ('PendingPayment', 'Expired') THROW 50005, 'BOOKING_NOT_PAYABLE', 1;

    IF @status = 'PendingPayment' AND @hold > DATEADD(MINUTE, 5, SYSUTCDATETIME())
    BEGIN
        COMMIT TRANSACTION;
        RETURN;
    END

    EXEC rental.usp_AssignCar @modelId, @pickup, @return, @BookingId, @CarId = @carId OUTPUT;

    UPDATE rental.Bookings
    SET CarId = @carId,
        IsOutsourced = CASE WHEN @carId IS NULL THEN 1 ELSE 0 END,
        BookingStatus = 'PendingPayment',
        HoldExpiresAtUtc = DATEADD(MINUTE, rental.fn_SettingInt('HoldMinutes', 30), SYSUTCDATETIME()),
        UpdatedAtUtc = SYSUTCDATETIME()
    WHERE BookingId = @BookingId;

    INSERT INTO rental.BookingAuditLog (BookingId, Action, OldStatus, NewStatus, Description)
    VALUES (@BookingId, 'HoldRenewed', @status, 'PendingPayment', NULL);

    COMMIT TRANSACTION;
END;
GO

-- Marks a still-unpaid booking as abandoned (customer went back and chose another car).
CREATE OR ALTER PROCEDURE rental.usp_AbandonBooking
    @BookingId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    UPDATE rental.Bookings
    SET BookingStatus = 'Expired', HoldExpiresAtUtc = NULL, UpdatedAtUtc = SYSUTCDATETIME()
    WHERE BookingId = @BookingId AND BookingStatus = 'PendingPayment';

    IF @@ROWCOUNT > 0
        INSERT INTO rental.BookingAuditLog (BookingId, Action, OldStatus, NewStatus, Actor)
        VALUES (@BookingId, 'Abandoned', 'PendingPayment', 'Expired', 'customer');

    COMMIT TRANSACTION;
END;
GO

CREATE OR ALTER PROCEDURE rental.usp_ExpireHolds
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @expired TABLE (BookingId int PRIMARY KEY);
    BEGIN TRANSACTION;

    UPDATE rental.Bookings
    SET BookingStatus = 'Expired', UpdatedAtUtc = SYSUTCDATETIME()
    OUTPUT inserted.BookingId INTO @expired (BookingId)
    WHERE BookingStatus = 'PendingPayment' AND HoldExpiresAtUtc <= SYSUTCDATETIME();

    INSERT INTO rental.BookingAuditLog (BookingId, Action, OldStatus, NewStatus, Actor)
    SELECT BookingId, 'HoldExpired', 'PendingPayment', 'Expired', 'system' FROM @expired;

    COMMIT TRANSACTION;
    SELECT COUNT(*) AS ExpiredCount FROM @expired;
END;
GO

/* ---------- Payments ---------- */

/*
  Records a verified provider capture and confirms the booking, atomically.
  Outcomes:
    Confirmed         - booking confirmed by this call
    AlreadyProcessed  - this capture was recorded before (idempotent replay)
    NotPayable        - booking already paid/cancelled: caller must refund this capture
*/
CREATE OR ALTER PROCEDURE rental.usp_RecordPaymentCapture
    @BookingId    int,
    @PaymentId    int,
    @CaptureId    varchar(64),
    @Amount       decimal(10,2),
    @Currency     char(3),
    @RawResponse  nvarchar(max) = NULL,
    @OfficeEmail  nvarchar(254) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @modelId int = (SELECT CarModelId FROM rental.Bookings WHERE BookingId = @BookingId);
    IF @modelId IS NULL THROW 50004, 'BOOKING_NOT_FOUND', 1;

    BEGIN TRANSACTION;
    EXEC rental.usp_LockCarModel @modelId;

    IF EXISTS (SELECT 1 FROM rental.Payments WHERE PayPalCaptureId = @CaptureId)
    BEGIN
        COMMIT TRANSACTION;
        SELECT 'AlreadyProcessed' AS Outcome;
        RETURN;
    END

    DECLARE @status varchar(20), @hold datetime2(0), @pickup datetime2(0), @return datetime2(0),
            @carId int, @outsourced bit, @email nvarchar(254), @total decimal(10,2);

    SELECT @status = b.BookingStatus, @hold = b.HoldExpiresAtUtc, @pickup = b.PickupDateTimeUtc,
           @return = b.ReturnDateTimeUtc, @carId = b.CarId, @outsourced = b.IsOutsourced,
           @email = c.Email, @total = b.TotalAmount
    FROM rental.Bookings b WITH (UPDLOCK, HOLDLOCK)
    JOIN rental.Customers c ON c.CustomerId = b.CustomerId
    WHERE b.BookingId = @BookingId;

    IF @status NOT IN ('PendingPayment', 'Expired') OR @Amount <> @total OR @Currency <> 'EUR'
    BEGIN
        UPDATE rental.Payments
        SET PaymentStatus = 'Failed', PayPalCaptureId = @CaptureId, FailureReason = N'Captured for a booking that is not payable (' + @status + N').',
            RawResponse = @RawResponse, UpdatedAtUtc = SYSUTCDATETIME()
        WHERE PaymentId = @PaymentId;
        INSERT INTO rental.BookingAuditLog (BookingId, Action, OldStatus, NewStatus, Description)
        VALUES (@BookingId, 'PaymentRejected', @status, @status, N'Capture ' + @CaptureId + N' needs a refund.');
        COMMIT TRANSACTION;
        SELECT 'NotPayable' AS Outcome;
        RETURN;
    END

    -- The hold lapsed: the held car may have been taken, so assign again (or outsource).
    IF @status = 'Expired' OR @hold IS NULL OR @hold <= SYSUTCDATETIME()
    BEGIN
        EXEC rental.usp_AssignCar @modelId, @pickup, @return, @BookingId, @CarId = @carId OUTPUT;
        SET @outsourced = CASE WHEN @carId IS NULL THEN 1 ELSE 0 END;
    END

    UPDATE rental.Payments
    SET PaymentStatus = 'Successful', PayPalCaptureId = @CaptureId, PaymentDateUtc = SYSUTCDATETIME(),
        RawResponse = @RawResponse, FailureReason = NULL, UpdatedAtUtc = SYSUTCDATETIME()
    WHERE PaymentId = @PaymentId AND BookingId = @BookingId;
    IF @@ROWCOUNT = 0 THROW 50006, 'PAYMENT_NOT_FOUND', 1;

    UPDATE rental.Bookings
    SET BookingStatus = 'Confirmed', PaymentStatus = 'Successful', CarId = @carId, IsOutsourced = @outsourced,
        HoldExpiresAtUtc = NULL, ConfirmedAtUtc = SYSUTCDATETIME(), UpdatedAtUtc = SYSUTCDATETIME()
    WHERE BookingId = @BookingId;

    -- Any other open orders for this booking can no longer be used.
    UPDATE rental.Payments SET PaymentStatus = 'Cancelled', UpdatedAtUtc = SYSUTCDATETIME()
    WHERE BookingId = @BookingId AND PaymentId <> @PaymentId AND PaymentStatus = 'Pending';

    INSERT INTO rental.BookingAuditLog (BookingId, Action, OldStatus, NewStatus, Description)
    VALUES (@BookingId, 'PaymentCaptured', @status, 'Confirmed',
            N'PayPal capture ' + @CaptureId + CASE WHEN @outsourced = 1 THEN N'. Outsourced car required.' ELSE N'.' END);

    INSERT INTO rental.EmailOutbox (BookingId, Template, ToAddress) VALUES (@BookingId, 'BookingConfirmed', @email);
    IF @OfficeEmail IS NOT NULL
        INSERT INTO rental.EmailOutbox (BookingId, Template, ToAddress) VALUES (@BookingId, 'OfficeBookingConfirmed', @OfficeEmail);

    COMMIT TRANSACTION;
    SELECT 'Confirmed' AS Outcome;
END;
GO

CREATE OR ALTER PROCEDURE rental.usp_RecordPaymentFailure
    @PaymentId     int,
    @FailureReason nvarchar(300),
    @RawResponse   nvarchar(max) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    UPDATE rental.Payments
    SET PaymentStatus = 'Failed', FailureReason = @FailureReason, RawResponse = ISNULL(@RawResponse, RawResponse), UpdatedAtUtc = SYSUTCDATETIME()
    WHERE PaymentId = @PaymentId AND PaymentStatus = 'Pending';

    UPDATE b
    SET PaymentStatus = 'Failed', UpdatedAtUtc = SYSUTCDATETIME()
    FROM rental.Bookings b
    JOIN rental.Payments p ON p.BookingId = b.BookingId
    WHERE p.PaymentId = @PaymentId AND b.BookingStatus IN ('PendingPayment', 'Expired');

    INSERT INTO rental.BookingAuditLog (BookingId, Action, Description)
    SELECT BookingId, 'PaymentFailed', @FailureReason FROM rental.Payments WHERE PaymentId = @PaymentId;

    COMMIT TRANSACTION;
END;
GO

/* ---------- Cancellation and refunds ---------- */

/*
  Outcomes: Cancelled | AlreadyCancelled
  Errors:   BOOKING_NOT_CANCELLABLE, PICKUP_PASSED
*/
CREATE OR ALTER PROCEDURE rental.usp_CancelBooking
    @BookingId         int,
    @Reason            nvarchar(500) = NULL,
    @PolicyId          int = NULL,
    @HoursBeforePickup decimal(10,2),
    @FeePercent        decimal(5,2),
    @Fee               decimal(10,2),
    @Refund            decimal(10,2),
    @RequestedBy       varchar(20) = 'Customer',
    @IpAddress         varchar(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    DECLARE @status varchar(20), @paymentStatus varchar(20), @pickup datetime2(0);
    SELECT @status = BookingStatus, @paymentStatus = PaymentStatus, @pickup = PickupDateTimeUtc
    FROM rental.Bookings WITH (UPDLOCK, HOLDLOCK) WHERE BookingId = @BookingId;

    IF @status IS NULL THROW 50004, 'BOOKING_NOT_FOUND', 1;

    IF EXISTS (SELECT 1 FROM rental.BookingCancellation WHERE BookingId = @BookingId)
    BEGIN
        COMMIT TRANSACTION;
        SELECT 'AlreadyCancelled' AS Outcome;
        RETURN;
    END

    IF @status NOT IN ('Confirmed', 'PendingPayment') THROW 50030, 'BOOKING_NOT_CANCELLABLE', 1;
    IF @pickup <= SYSUTCDATETIME() THROW 50031, 'PICKUP_PASSED', 1;
    IF @Refund > 0 AND @paymentStatus <> 'Successful' THROW 50032, 'NOTHING_TO_REFUND', 1;

    INSERT INTO rental.BookingCancellation (BookingId, CancellationReason, PolicyId, HoursBeforePickup, FeePercent, CancellationFee, RefundAmount, CancellationStatus, RequestedBy, IpAddress)
    VALUES (@BookingId, @Reason, @PolicyId, @HoursBeforePickup, @FeePercent, @Fee, @Refund,
            CASE WHEN @Refund > 0 THEN 'RefundPending' ELSE 'NoRefundDue' END, @RequestedBy, @IpAddress);

    UPDATE rental.Bookings
    SET BookingStatus = 'Cancelled',
        PaymentStatus = CASE WHEN PaymentStatus IN ('Pending', 'Failed') THEN 'Cancelled' ELSE PaymentStatus END,
        HoldExpiresAtUtc = NULL, CancelledAtUtc = SYSUTCDATETIME(), UpdatedAtUtc = SYSUTCDATETIME()
    WHERE BookingId = @BookingId;

    UPDATE rental.Payments SET PaymentStatus = 'Cancelled', UpdatedAtUtc = SYSUTCDATETIME()
    WHERE BookingId = @BookingId AND PaymentStatus = 'Pending';

    INSERT INTO rental.BookingAuditLog (BookingId, Action, OldStatus, NewStatus, Actor, IpAddress, Description)
    VALUES (@BookingId, 'Cancelled', @status, 'Cancelled', LOWER(@RequestedBy), @IpAddress,
            N'Fee ' + CAST(@Fee AS nvarchar(20)) + N' EUR, refund ' + CAST(@Refund AS nvarchar(20)) + N' EUR.');

    COMMIT TRANSACTION;
    SELECT 'Cancelled' AS Outcome;
END;
GO

CREATE OR ALTER PROCEDURE rental.usp_RecordRefund
    @BookingId       int,
    @PaymentId       int,
    @Succeeded       bit,
    @RefundReference varchar(64) = NULL,
    @RefundAmount    decimal(10,2),
    @Error           nvarchar(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    IF @Succeeded = 1
    BEGIN
        DECLARE @paid decimal(10,2), @already decimal(10,2), @newStatus varchar(20), @paymentStatus varchar(20);
        SELECT @paid = Amount, @already = RefundAmount, @paymentStatus = PaymentStatus
        FROM rental.Payments WITH (UPDLOCK) WHERE PaymentId = @PaymentId AND BookingId = @BookingId;
        IF @paid IS NULL THROW 50006, 'PAYMENT_NOT_FOUND', 1;

        -- A rejected (duplicate / not payable) capture: record the refund only, the booking is untouched.
        IF @paymentStatus = 'Failed'
        BEGIN
            UPDATE rental.Payments
            SET RefundAmount = @RefundAmount, RefundReference = @RefundReference, UpdatedAtUtc = SYSUTCDATETIME()
            WHERE PaymentId = @PaymentId;
            INSERT INTO rental.BookingAuditLog (BookingId, Action, Description)
            VALUES (@BookingId, 'RejectedCaptureRefunded', N'Refund ' + ISNULL(@RefundReference, N'?') + N' for ' + CAST(@RefundAmount AS nvarchar(20)) + N' EUR.');
            COMMIT TRANSACTION;
            RETURN;
        END

        -- Replaying the same refund reference must not count twice.
        IF NOT EXISTS (SELECT 1 FROM rental.Payments WHERE PaymentId = @PaymentId AND RefundReference = @RefundReference)
        BEGIN
            SET @newStatus = CASE WHEN @already + @RefundAmount >= @paid THEN 'Refunded' ELSE 'PartiallyRefunded' END;

            UPDATE rental.Payments
            SET RefundAmount = @already + @RefundAmount, RefundReference = @RefundReference, PaymentStatus = @newStatus, UpdatedAtUtc = SYSUTCDATETIME()
            WHERE PaymentId = @PaymentId;

            UPDATE rental.Bookings SET PaymentStatus = @newStatus, UpdatedAtUtc = SYSUTCDATETIME() WHERE BookingId = @BookingId;

            INSERT INTO rental.BookingAuditLog (BookingId, Action, Description)
            VALUES (@BookingId, 'Refunded', N'Refund ' + ISNULL(@RefundReference, N'?') + N' for ' + CAST(@RefundAmount AS nvarchar(20)) + N' EUR.');
        END

        UPDATE rental.BookingCancellation SET CancellationStatus = 'Refunded', RefundReference = @RefundReference
        WHERE BookingId = @BookingId;
    END
    ELSE
    BEGIN
        UPDATE rental.BookingCancellation SET CancellationStatus = 'RefundFailed' WHERE BookingId = @BookingId;
        INSERT INTO rental.BookingAuditLog (BookingId, Action, Description)
        VALUES (@BookingId, 'RefundFailed', @Error);
    END

    COMMIT TRANSACTION;
END;
GO

/* ---------- Email outbox ---------- */

-- Claims up to @BatchSize due emails for this worker. READPAST lets several workers run safely.
CREATE OR ALTER PROCEDURE rental.usp_ClaimOutboxEmails
    @BatchSize   int = 10,
    @LockSeconds int = 120
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @now datetime2(0) = SYSUTCDATETIME();

    WITH due AS (
        SELECT TOP (@BatchSize) *
        FROM rental.EmailOutbox WITH (ROWLOCK, UPDLOCK, READPAST)
        WHERE (Status = 'Pending' AND NextAttemptAtUtc <= @now)
           OR (Status = 'Sending' AND LockedUntilUtc < @now)
        ORDER BY NextAttemptAtUtc, EmailId
    )
    UPDATE due
    SET Status = 'Sending', LockedUntilUtc = DATEADD(SECOND, @LockSeconds, @now), Attempts = Attempts + 1
    OUTPUT inserted.EmailId, inserted.BookingId, inserted.Template, inserted.ToAddress, inserted.PayloadJson, inserted.Attempts;
END;
GO
