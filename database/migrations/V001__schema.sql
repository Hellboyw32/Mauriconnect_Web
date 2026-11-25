SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
/*
  MauriConnect public booking platform - core schema.
  All timestamps are stored in UTC (datetime2). Mauritius local time (UTC+4, no DST)
  is applied only for display and for business-day rules in the application layer.
*/
IF SCHEMA_ID(N'rental') IS NULL EXEC (N'CREATE SCHEMA rental AUTHORIZATION dbo');
GO

/* ---------- Catalogue ---------- */

CREATE TABLE rental.CarCategories (
    CarCategoryId   int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CarCategories PRIMARY KEY,
    CategoryName    nvarchar(50)  NOT NULL CONSTRAINT UQ_CarCategories_Name UNIQUE,
    Slug            varchar(50)   NOT NULL CONSTRAINT UQ_CarCategories_Slug UNIQUE,
    Description     nvarchar(300) NULL,
    DisplayOrder    int           NOT NULL CONSTRAINT DF_CarCategories_DisplayOrder DEFAULT (0),
    IsActive        bit           NOT NULL CONSTRAINT DF_CarCategories_IsActive DEFAULT (1)
);
GO

CREATE TABLE rental.CarModels (
    CarModelId          int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CarModels PRIMARY KEY,
    Slug                varchar(80)    NOT NULL CONSTRAINT UQ_CarModels_Slug UNIQUE,
    CarCategoryId       int            NOT NULL CONSTRAINT FK_CarModels_Category REFERENCES rental.CarCategories (CarCategoryId),
    ModelName           nvarchar(100)  NOT NULL,
    Description         nvarchar(1000) NULL,
    Transmission        varchar(20)    NOT NULL CONSTRAINT CK_CarModels_Transmission CHECK (Transmission IN ('Automatic', 'Manual')),
    FuelType            varchar(20)    NOT NULL CONSTRAINT CK_CarModels_FuelType CHECK (FuelType IN ('Petrol', 'Diesel', 'Hybrid', 'Electric')),
    PassengerCapacity   tinyint        NOT NULL CONSTRAINT CK_CarModels_Passengers CHECK (PassengerCapacity > 0),
    DoorCount           tinyint        NOT NULL CONSTRAINT CK_CarModels_Doors CHECK (DoorCount > 0),
    LuggageCapacity     tinyint        NOT NULL CONSTRAINT CK_CarModels_Luggage CHECK (LuggageCapacity >= 0),
    HasAirConditioning  bit            NOT NULL CONSTRAINT DF_CarModels_AC DEFAULT (1),
    ImageUrl            nvarchar(300)  NULL,
    SecurityDeposit     decimal(10,2)  NULL CONSTRAINT CK_CarModels_Deposit CHECK (SecurityDeposit IS NULL OR SecurityDeposit >= 0),
    DisplayOrder        int            NOT NULL CONSTRAINT DF_CarModels_DisplayOrder DEFAULT (0),
    IsActive            bit            NOT NULL CONSTRAINT DF_CarModels_IsActive DEFAULT (1)
);
CREATE INDEX IX_CarModels_Category ON rental.CarModels (CarCategoryId) INCLUDE (IsActive, DisplayOrder);
GO

-- Physical vehicles. Customers book a model ("or similar"); a car is assigned to each booking.
CREATE TABLE rental.Cars (
    CarId               int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Cars PRIMARY KEY,
    CarModelId          int           NOT NULL CONSTRAINT FK_Cars_Model REFERENCES rental.CarModels (CarModelId),
    RegistrationNumber  nvarchar(20)  NOT NULL CONSTRAINT UQ_Cars_Registration UNIQUE,
    Colour              nvarchar(30)  NULL,
    IsActive            bit           NOT NULL CONSTRAINT DF_Cars_IsActive DEFAULT (1)
);
CREATE INDEX IX_Cars_Model ON rental.Cars (CarModelId) INCLUDE (IsActive);
GO

CREATE TABLE rental.RentalLocations (
    LocationId      int IDENTITY(1,1) NOT NULL CONSTRAINT PK_RentalLocations PRIMARY KEY,
    Code            varchar(40)   NOT NULL CONSTRAINT UQ_RentalLocations_Code UNIQUE,
    LocationName    nvarchar(100) NOT NULL,
    LocationType    varchar(20)   NOT NULL CONSTRAINT CK_RentalLocations_Type CHECK (LocationType IN ('Office', 'DeliveryZone')),
    Address         nvarchar(300) NULL,
    DeliveryFee     decimal(10,2) NOT NULL CONSTRAINT DF_RentalLocations_Fee DEFAULT (0) CONSTRAINT CK_RentalLocations_Fee CHECK (DeliveryFee >= 0),
    RequiresAddress bit           NOT NULL CONSTRAINT DF_RentalLocations_RequiresAddress DEFAULT (0),
    DisplayOrder    int           NOT NULL CONSTRAINT DF_RentalLocations_DisplayOrder DEFAULT (0),
    IsActive        bit           NOT NULL CONSTRAINT DF_RentalLocations_IsActive DEFAULT (1)
);
GO

-- Date-range daily rates per model. Ranges are inclusive and may not overlap (see trigger).
CREATE TABLE rental.CarPricing (
    PricingId   int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CarPricing PRIMARY KEY,
    CarModelId  int           NOT NULL CONSTRAINT FK_CarPricing_Model REFERENCES rental.CarModels (CarModelId),
    RangeStart  date          NOT NULL,
    RangeEnd    date          NOT NULL,
    DailyRate   decimal(10,2) NOT NULL CONSTRAINT CK_CarPricing_Rate CHECK (DailyRate > 0),
    IsActive    bit           NOT NULL CONSTRAINT DF_CarPricing_IsActive DEFAULT (1),
    CONSTRAINT CK_CarPricing_Range CHECK (RangeEnd >= RangeStart)
);
CREATE INDEX IX_CarPricing_Model_Range ON rental.CarPricing (CarModelId, RangeStart, RangeEnd) INCLUDE (DailyRate, IsActive);
GO

-- Optional rental-length discounts. CarModelId NULL = applies to every model.
CREATE TABLE rental.DurationDiscounts (
    DiscountId  int IDENTITY(1,1) NOT NULL CONSTRAINT PK_DurationDiscounts PRIMARY KEY,
    CarModelId  int          NULL CONSTRAINT FK_DurationDiscounts_Model REFERENCES rental.CarModels (CarModelId),
    MinDays     smallint     NOT NULL CONSTRAINT CK_DurationDiscounts_MinDays CHECK (MinDays > 0),
    PercentOff  decimal(5,2) NOT NULL CONSTRAINT CK_DurationDiscounts_Percent CHECK (PercentOff > 0 AND PercentOff < 100),
    IsActive    bit          NOT NULL CONSTRAINT DF_DurationDiscounts_IsActive DEFAULT (1)
);
GO

CREATE TABLE rental.Extras (
    ExtraId      int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Extras PRIMARY KEY,
    Code         varchar(40)   NOT NULL CONSTRAINT UQ_Extras_Code UNIQUE,
    Name         nvarchar(100) NOT NULL,
    Description  nvarchar(300) NULL,
    PricingType  varchar(20)   NOT NULL CONSTRAINT CK_Extras_PricingType CHECK (PricingType IN ('PerDay', 'PerRental')),
    Price        decimal(10,2) NOT NULL CONSTRAINT CK_Extras_Price CHECK (Price >= 0),
    MaxCharge    decimal(10,2) NULL CONSTRAINT CK_Extras_MaxCharge CHECK (MaxCharge IS NULL OR MaxCharge > 0),
    MaxQuantity  tinyint       NOT NULL CONSTRAINT DF_Extras_MaxQuantity DEFAULT (1) CONSTRAINT CK_Extras_MaxQuantity CHECK (MaxQuantity BETWEEN 1 AND 10),
    DisplayOrder int           NOT NULL CONSTRAINT DF_Extras_DisplayOrder DEFAULT (0),
    IsActive     bit           NOT NULL CONSTRAINT DF_Extras_IsActive DEFAULT (1)
);
GO

CREATE TABLE rental.Settings (
    SettingKey   varchar(50)   NOT NULL CONSTRAINT PK_Settings PRIMARY KEY,
    SettingValue nvarchar(200) NOT NULL,
    Description  nvarchar(300) NULL
);
GO

CREATE TABLE rental.CancellationPolicies (
    PolicyId  int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CancellationPolicies PRIMARY KEY,
    Name      nvarchar(100) NOT NULL,
    IsActive  bit           NOT NULL CONSTRAINT DF_CancellationPolicies_IsActive DEFAULT (1)
);
CREATE UNIQUE INDEX UX_CancellationPolicies_Active ON rental.CancellationPolicies (IsActive) WHERE IsActive = 1;
GO

-- A rule applies when the cancellation happens at least HoursBeforePickup hours before pickup.
-- The rule with the highest qualifying HoursBeforePickup wins.
CREATE TABLE rental.CancellationPolicyRules (
    RuleId             int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CancellationPolicyRules PRIMARY KEY,
    PolicyId           int          NOT NULL CONSTRAINT FK_CancellationPolicyRules_Policy REFERENCES rental.CancellationPolicies (PolicyId),
    HoursBeforePickup  int          NOT NULL CONSTRAINT CK_CancellationPolicyRules_Hours CHECK (HoursBeforePickup >= 0),
    FeePercent         decimal(5,2) NOT NULL CONSTRAINT CK_CancellationPolicyRules_Fee CHECK (FeePercent BETWEEN 0 AND 100),
    CONSTRAINT UQ_CancellationPolicyRules UNIQUE (PolicyId, HoursBeforePickup)
);
GO

/* ---------- Customers and bookings ---------- */

-- One row per booking (no customer accounts).
CREATE TABLE rental.Customers (
    CustomerId            int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Customers PRIMARY KEY,
    PublicId              uniqueidentifier NOT NULL CONSTRAINT DF_Customers_PublicId DEFAULT (NEWID()) CONSTRAINT UQ_Customers_PublicId UNIQUE,
    FirstName             nvarchar(100) NOT NULL,
    LastName              nvarchar(100) NOT NULL,
    Email                 nvarchar(254) NOT NULL,
    MobileNumber          varchar(20)   NOT NULL,
    Country               char(2)       NOT NULL,
    Nationality           char(2)       NOT NULL,
    Address               nvarchar(300) NOT NULL,
    City                  nvarchar(100) NOT NULL,
    PostalCode            nvarchar(20)  NOT NULL,
    DrivingLicenceNumber  nvarchar(50)  NULL,
    CreatedAtUtc          datetime2(0)  NOT NULL CONSTRAINT DF_Customers_CreatedAt DEFAULT (SYSUTCDATETIME())
);
CREATE INDEX IX_Customers_Email ON rental.Customers (Email);
GO

CREATE TABLE rental.Bookings (
    BookingId          int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Bookings PRIMARY KEY,
    BookingReference   char(14)       NOT NULL CONSTRAINT UQ_Bookings_Reference UNIQUE,
    CustomerId         int            NOT NULL CONSTRAINT FK_Bookings_Customer REFERENCES rental.Customers (CustomerId),
    CarModelId         int            NOT NULL CONSTRAINT FK_Bookings_Model REFERENCES rental.CarModels (CarModelId),
    CarId              int            NULL CONSTRAINT FK_Bookings_Car REFERENCES rental.Cars (CarId),
    IsOutsourced       bit            NOT NULL CONSTRAINT DF_Bookings_IsOutsourced DEFAULT (0),
    PickupLocationId   int            NOT NULL CONSTRAINT FK_Bookings_PickupLocation REFERENCES rental.RentalLocations (LocationId),
    ReturnLocationId   int            NOT NULL CONSTRAINT FK_Bookings_ReturnLocation REFERENCES rental.RentalLocations (LocationId),
    PickupAddress      nvarchar(300)  NULL,
    ReturnAddress      nvarchar(300)  NULL,
    PickupDateTimeUtc  datetime2(0)   NOT NULL,
    ReturnDateTimeUtc  datetime2(0)   NOT NULL,
    RentalDays         smallint       NOT NULL CONSTRAINT CK_Bookings_RentalDays CHECK (RentalDays > 0),
    SubTotal           decimal(10,2)  NOT NULL CONSTRAINT CK_Bookings_SubTotal CHECK (SubTotal >= 0),
    AdditionalCharges  decimal(10,2)  NOT NULL CONSTRAINT CK_Bookings_Additional CHECK (AdditionalCharges >= 0),
    TotalAmount        decimal(10,2)  NOT NULL,
    SecurityDeposit    decimal(10,2)  NULL,
    Currency           char(3)        NOT NULL CONSTRAINT DF_Bookings_Currency DEFAULT ('EUR') CONSTRAINT CK_Bookings_Currency CHECK (Currency = 'EUR'),
    BookingStatus      varchar(20)    NOT NULL CONSTRAINT CK_Bookings_Status CHECK (BookingStatus IN ('PendingPayment', 'Confirmed', 'InProgress', 'Completed', 'Cancelled', 'Expired')),
    PaymentStatus      varchar(20)    NOT NULL CONSTRAINT CK_Bookings_PaymentStatus CHECK (PaymentStatus IN ('Pending', 'Successful', 'Failed', 'Refunded', 'PartiallyRefunded', 'Cancelled')),
    HoldExpiresAtUtc   datetime2(0)   NULL,
    FlightNumber       nvarchar(20)   NULL,
    ArrivalDateTimeUtc datetime2(0)   NULL,
    Accommodation      nvarchar(200)  NULL,
    SpecialRequests    nvarchar(1000) NULL,
    IdempotencyKey     varchar(64)    NULL,
    ConfirmedAtUtc     datetime2(0)   NULL,
    CancelledAtUtc     datetime2(0)   NULL,
    RowVersion         rowversion     NOT NULL,
    CreatedAtUtc       datetime2(0)   NOT NULL CONSTRAINT DF_Bookings_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAtUtc       datetime2(0)   NOT NULL CONSTRAINT DF_Bookings_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Bookings_Period CHECK (ReturnDateTimeUtc > PickupDateTimeUtc),
    CONSTRAINT CK_Bookings_Total CHECK (TotalAmount = SubTotal + AdditionalCharges),
    CONSTRAINT CK_Bookings_Outsourced CHECK (IsOutsourced = 0 OR CarId IS NULL)
);
CREATE INDEX IX_Bookings_Car_Period ON rental.Bookings (CarId, PickupDateTimeUtc, ReturnDateTimeUtc) INCLUDE (BookingStatus, HoldExpiresAtUtc) WHERE CarId IS NOT NULL;
CREATE INDEX IX_Bookings_Status_Hold ON rental.Bookings (BookingStatus, HoldExpiresAtUtc);
CREATE INDEX IX_Bookings_Customer ON rental.Bookings (CustomerId);
CREATE UNIQUE INDEX UX_Bookings_IdempotencyKey ON rental.Bookings (IdempotencyKey) WHERE IdempotencyKey IS NOT NULL;
GO

-- Itemised price lines shown to the customer (rental, discount, delivery, extras, fees).
CREATE TABLE rental.BookingCharges (
    ChargeId     int IDENTITY(1,1) NOT NULL CONSTRAINT PK_BookingCharges PRIMARY KEY,
    BookingId    int           NOT NULL CONSTRAINT FK_BookingCharges_Booking REFERENCES rental.Bookings (BookingId),
    ChargeType   varchar(20)   NOT NULL CONSTRAINT CK_BookingCharges_Type CHECK (ChargeType IN ('Rental', 'Discount', 'Delivery', 'OutOfHours', 'Extra')),
    ExtraId      int           NULL CONSTRAINT FK_BookingCharges_Extra REFERENCES rental.Extras (ExtraId),
    Description  nvarchar(200) NOT NULL,
    Quantity     smallint      NOT NULL CONSTRAINT DF_BookingCharges_Quantity DEFAULT (1),
    Amount       decimal(10,2) NOT NULL,
    SortOrder    int           NOT NULL CONSTRAINT DF_BookingCharges_SortOrder DEFAULT (0)
);
CREATE INDEX IX_BookingCharges_Booking ON rental.BookingCharges (BookingId);
GO

/* ---------- Payments ---------- */

CREATE TABLE rental.Payments (
    PaymentId         int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Payments PRIMARY KEY,
    BookingId         int            NOT NULL CONSTRAINT FK_Payments_Booking REFERENCES rental.Bookings (BookingId),
    PaymentProvider   varchar(20)    NOT NULL CONSTRAINT DF_Payments_Provider DEFAULT ('PayPal'),
    PayPalOrderId     varchar(64)    NULL,
    PayPalCaptureId   varchar(64)    NULL,
    Amount            decimal(10,2)  NOT NULL CONSTRAINT CK_Payments_Amount CHECK (Amount > 0),
    Currency          char(3)        NOT NULL,
    PaymentStatus     varchar(20)    NOT NULL CONSTRAINT CK_Payments_Status CHECK (PaymentStatus IN ('Pending', 'Successful', 'Failed', 'Refunded', 'PartiallyRefunded', 'Cancelled')),
    PaymentDateUtc    datetime2(0)   NULL,
    RefundAmount      decimal(10,2)  NOT NULL CONSTRAINT DF_Payments_RefundAmount DEFAULT (0) CONSTRAINT CK_Payments_RefundAmount CHECK (RefundAmount >= 0),
    RefundReference   varchar(64)    NULL,
    FailureReason     nvarchar(300)  NULL,
    RawResponse       nvarchar(max)  NULL,
    CreatedAtUtc      datetime2(0)   NOT NULL CONSTRAINT DF_Payments_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAtUtc      datetime2(0)   NOT NULL CONSTRAINT DF_Payments_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Payments_Refund CHECK (RefundAmount <= Amount)
);
CREATE UNIQUE INDEX UX_Payments_OrderId ON rental.Payments (PayPalOrderId) WHERE PayPalOrderId IS NOT NULL;
CREATE UNIQUE INDEX UX_Payments_CaptureId ON rental.Payments (PayPalCaptureId) WHERE PayPalCaptureId IS NOT NULL;
-- At most one captured payment per booking: blocks double charging.
CREATE UNIQUE INDEX UX_Payments_OneCapturedPerBooking ON rental.Payments (BookingId) WHERE PaymentStatus IN ('Successful', 'Refunded', 'PartiallyRefunded');
CREATE INDEX IX_Payments_Booking ON rental.Payments (BookingId) INCLUDE (PaymentStatus);
GO

-- Webhook events, stored once per provider event id (idempotency).
CREATE TABLE rental.PaymentEvents (
    EventId          int IDENTITY(1,1) NOT NULL CONSTRAINT PK_PaymentEvents PRIMARY KEY,
    ProviderEventId  varchar(100)  NOT NULL CONSTRAINT UQ_PaymentEvents_ProviderEventId UNIQUE,
    EventType        varchar(100)  NOT NULL,
    PayloadJson      nvarchar(max) NOT NULL,
    ReceivedAtUtc    datetime2(0)  NOT NULL CONSTRAINT DF_PaymentEvents_Received DEFAULT (SYSUTCDATETIME()),
    ProcessedAtUtc   datetime2(0)  NULL,
    ProcessingError  nvarchar(500) NULL
);
GO

/* ---------- Cancellation, documents, email, audit ---------- */

CREATE TABLE rental.BookingCancellation (
    CancellationId      int IDENTITY(1,1) NOT NULL CONSTRAINT PK_BookingCancellation PRIMARY KEY,
    BookingId           int            NOT NULL CONSTRAINT FK_BookingCancellation_Booking REFERENCES rental.Bookings (BookingId)
                                       CONSTRAINT UQ_BookingCancellation_Booking UNIQUE,
    CancellationDateUtc datetime2(0)   NOT NULL CONSTRAINT DF_BookingCancellation_Date DEFAULT (SYSUTCDATETIME()),
    CancellationReason  nvarchar(500)  NULL,
    PolicyId            int            NULL CONSTRAINT FK_BookingCancellation_Policy REFERENCES rental.CancellationPolicies (PolicyId),
    HoursBeforePickup   decimal(10,2)  NOT NULL,
    FeePercent          decimal(5,2)   NOT NULL,
    CancellationFee     decimal(10,2)  NOT NULL CONSTRAINT CK_BookingCancellation_Fee CHECK (CancellationFee >= 0),
    RefundAmount        decimal(10,2)  NOT NULL CONSTRAINT CK_BookingCancellation_Refund CHECK (RefundAmount >= 0),
    CancellationStatus  varchar(20)    NOT NULL CONSTRAINT CK_BookingCancellation_Status CHECK (CancellationStatus IN ('NoRefundDue', 'RefundPending', 'Refunded', 'RefundFailed')),
    RefundReference     varchar(64)    NULL,
    RequestedBy         varchar(20)    NOT NULL CONSTRAINT DF_BookingCancellation_RequestedBy DEFAULT ('Customer'),
    IpAddress           varchar(45)    NULL
);
GO

CREATE TABLE rental.BookingDocuments (
    DocumentId    int IDENTITY(1,1) NOT NULL CONSTRAINT PK_BookingDocuments PRIMARY KEY,
    BookingId     int           NOT NULL CONSTRAINT FK_BookingDocuments_Booking REFERENCES rental.Bookings (BookingId),
    DocumentType  varchar(20)   NOT NULL CONSTRAINT CK_BookingDocuments_Type CHECK (DocumentType IN ('Voucher', 'Cancellation')),
    DocumentPath  nvarchar(400) NOT NULL,
    CreatedAtUtc  datetime2(0)  NOT NULL CONSTRAINT DF_BookingDocuments_CreatedAt DEFAULT (SYSUTCDATETIME())
);
CREATE INDEX IX_BookingDocuments_Booking ON rental.BookingDocuments (BookingId, DocumentType);
GO

CREATE TABLE rental.EmailOutbox (
    EmailId           int IDENTITY(1,1) NOT NULL CONSTRAINT PK_EmailOutbox PRIMARY KEY,
    BookingId         int            NULL CONSTRAINT FK_EmailOutbox_Booking REFERENCES rental.Bookings (BookingId),
    Template          varchar(50)    NOT NULL,
    ToAddress         nvarchar(254)  NOT NULL,
    PayloadJson       nvarchar(max)  NULL,
    Status            varchar(20)    NOT NULL CONSTRAINT DF_EmailOutbox_Status DEFAULT ('Pending') CONSTRAINT CK_EmailOutbox_Status CHECK (Status IN ('Pending', 'Sending', 'Sent', 'Failed')),
    Attempts          int            NOT NULL CONSTRAINT DF_EmailOutbox_Attempts DEFAULT (0),
    NextAttemptAtUtc  datetime2(0)   NOT NULL CONSTRAINT DF_EmailOutbox_NextAttempt DEFAULT (SYSUTCDATETIME()),
    LockedUntilUtc    datetime2(0)   NULL,
    LastError         nvarchar(1000) NULL,
    SentAtUtc         datetime2(0)   NULL,
    CreatedAtUtc      datetime2(0)   NOT NULL CONSTRAINT DF_EmailOutbox_CreatedAt DEFAULT (SYSUTCDATETIME())
);
CREATE INDEX IX_EmailOutbox_Status_Next ON rental.EmailOutbox (Status, NextAttemptAtUtc);
GO

CREATE TABLE rental.BookingAuditLog (
    AuditId       bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_BookingAuditLog PRIMARY KEY,
    BookingId     int            NOT NULL CONSTRAINT FK_BookingAuditLog_Booking REFERENCES rental.Bookings (BookingId),
    Action        varchar(50)    NOT NULL,
    OldStatus     varchar(20)    NULL,
    NewStatus     varchar(20)    NULL,
    Actor         varchar(50)    NOT NULL CONSTRAINT DF_BookingAuditLog_Actor DEFAULT ('system'),
    IpAddress     varchar(45)    NULL,
    Description   nvarchar(1000) NULL,
    CreatedAtUtc  datetime2(0)   NOT NULL CONSTRAINT DF_BookingAuditLog_CreatedAt DEFAULT (SYSUTCDATETIME())
);
CREATE INDEX IX_BookingAuditLog_Booking ON rental.BookingAuditLog (BookingId, CreatedAtUtc);
GO

-- Request-a-quote and contact form submissions.
CREATE TABLE rental.Enquiries (
    EnquiryId     int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Enquiries PRIMARY KEY,
    EnquiryType   varchar(20)    NOT NULL CONSTRAINT CK_Enquiries_Type CHECK (EnquiryType IN ('Quote', 'Contact')),
    Name          nvarchar(200)  NOT NULL,
    Email         nvarchar(254)  NOT NULL,
    Phone         varchar(20)    NULL,
    Message       nvarchar(2000) NOT NULL,
    IpAddress     varchar(45)    NULL,
    CreatedAtUtc  datetime2(0)   NOT NULL CONSTRAINT DF_Enquiries_CreatedAt DEFAULT (SYSUTCDATETIME())
);
GO
