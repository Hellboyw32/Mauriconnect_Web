USE [CarBooking]
GO

-- ===================== CarPSVL =====================
-- One row per PSVL (Public Service Vehicle Licence) period of a car. A car can
-- have many rows over time (renewals) but only one can be active at any moment:
-- spUpdateCarPSVLDetails rejects a live row whose period overlaps another live
-- row of the same car. Soft-deleted rows (IsActive = 0) are ignored by that rule.
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CarPSVL')
BEGIN
    CREATE TABLE dbo.CarPSVL (
        PsvlId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CarPSVL_PsvlId PRIMARY KEY CLUSTERED,
        CarId INT NOT NULL CONSTRAINT FK_CarPSVL_Cars FOREIGN KEY REFERENCES dbo.Cars(CarId),
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        Company NVARCHAR(200) NULL,
        Note NVARCHAR(MAX) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_CarPSVL_IsActive DEFAULT (1),
        CreatedTimeStamp DATETIME NOT NULL CONSTRAINT DF_CarPSVL_CreatedTimeStamp DEFAULT (GETDATE()),
        LastModifiedTimeStamp DATETIME NULL,
        LastModifiedUserId VARCHAR(100) NULL,
        CONSTRAINT CK_CarPSVL_Dates CHECK (EndDate >= StartDate)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CarPSVL_CarId' AND object_id = OBJECT_ID('dbo.CarPSVL'))
BEGIN
    CREATE INDEX IX_CarPSVL_CarId ON dbo.CarPSVL(CarId, StartDate DESC) WHERE IsActive = 1;
END
GO
