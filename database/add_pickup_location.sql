USE [CarBooking]
GO

-- Add PickupLocation column to Booking table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Booking' AND COLUMN_NAME = 'PickupLocation'
)
BEGIN
    ALTER TABLE dbo.Booking ADD PickupLocation varchar(max) NULL;
END
GO
