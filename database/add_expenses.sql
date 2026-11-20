USE [CarBooking]
GO

-- ===================== Expenses =====================
-- Company expense register used for monthly VAT preparation (MRA Table 2).
-- Amounts are DECIMAL so VAT totals are exact. TotalInvoiceAmount is a persisted
-- computed column (Amount Excluding VAT + VAT Amount) so it can never drift from
-- its parts. Rows are soft-deleted (IsActive = 0) to keep the audit trail and
-- the supporting documents reachable for historical records.
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Expenses')
BEGIN
    CREATE TABLE dbo.Expenses (
        ExpenseId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Expenses_ExpenseId PRIMARY KEY CLUSTERED,
        ExpenseDate DATE NOT NULL,                         -- date on the supplier invoice, NOT the entry date
        InvoiceNumber NVARCHAR(100) NULL,
        SupplierName NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NOT NULL,
        AmountExcludingVAT DECIMAL(18,2) NOT NULL CONSTRAINT DF_Expenses_AmountExcludingVAT DEFAULT (0),
        VATAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Expenses_VATAmount DEFAULT (0),
        TotalInvoiceAmount AS (AmountExcludingVAT + VATAmount) PERSISTED,
        Notes NVARCHAR(MAX) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Expenses_IsActive DEFAULT (1),
        CreatedByUserId INT NULL CONSTRAINT FK_Expenses_CreatedByUser FOREIGN KEY REFERENCES dbo.Users(UserId),
        CreatedBy VARCHAR(100) NOT NULL,
        CreatedDate DATETIME NOT NULL CONSTRAINT DF_Expenses_CreatedDate DEFAULT (GETDATE()),
        LastModifiedBy VARCHAR(100) NULL,
        LastModifiedDate DATETIME NULL,
        CONSTRAINT CK_Expenses_NonNegative CHECK (AmountExcludingVAT >= 0 AND VATAmount >= 0)
    );
END
GO

-- Reports filter on ExpenseDate; the duplicate-invoice warning looks up supplier + invoice.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Expenses_ExpenseDate' AND object_id = OBJECT_ID('dbo.Expenses'))
    CREATE INDEX IX_Expenses_ExpenseDate ON dbo.Expenses(ExpenseDate DESC) WHERE IsActive = 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Expenses_Supplier_Invoice' AND object_id = OBJECT_ID('dbo.Expenses'))
    CREATE INDEX IX_Expenses_Supplier_Invoice ON dbo.Expenses(SupplierName, InvoiceNumber) WHERE IsActive = 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Expenses_CreatedByUserId' AND object_id = OBJECT_ID('dbo.Expenses'))
    CREATE INDEX IX_Expenses_CreatedByUserId ON dbo.Expenses(CreatedByUserId) WHERE IsActive = 1;
GO

-- ===================== ExpenseAttachments =====================
-- Supporting invoices/receipts. The file itself lives on the FTP server under
-- /Dropbox/Expenses/[ExpenseId]/[StoredFileName]; this row is the index to it.
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ExpenseAttachments')
BEGIN
    CREATE TABLE dbo.ExpenseAttachments (
        AttachmentId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ExpenseAttachments_AttachmentId PRIMARY KEY CLUSTERED,
        ExpenseId INT NOT NULL CONSTRAINT FK_ExpenseAttachments_Expenses FOREIGN KEY REFERENCES dbo.Expenses(ExpenseId),
        FileName NVARCHAR(260) NOT NULL,                   -- original name shown to users
        StoredFileName NVARCHAR(300) NOT NULL,             -- unique name on the file server
        FilePath NVARCHAR(600) NOT NULL,
        ContentType VARCHAR(100) NULL,
        FileSize INT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_ExpenseAttachments_IsActive DEFAULT (1),
        UploadedBy VARCHAR(100) NOT NULL,
        UploadedDate DATETIME NOT NULL CONSTRAINT DF_ExpenseAttachments_UploadedDate DEFAULT (GETDATE())
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ExpenseAttachments_ExpenseId' AND object_id = OBJECT_ID('dbo.ExpenseAttachments'))
    CREATE INDEX IX_ExpenseAttachments_ExpenseId ON dbo.ExpenseAttachments(ExpenseId) WHERE IsActive = 1;
GO

-- ===================== Permissions =====================
-- Add the 'Expenses' module for existing Normal users (absence of a row already
-- means "allowed", see add_user_permissions.sql - this just makes it explicit in
-- the permissions matrix).
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserPermissions')
BEGIN
    INSERT INTO dbo.UserPermissions (UserId, Module, CanView, CanCreate, CanEdit, CanDelete)
    SELECT u.UserId, 'Expenses', 1, 1, 1, 1
    FROM dbo.Users u
    WHERE u.UserType = 'Normal'
        AND NOT EXISTS (
            SELECT 1 FROM dbo.UserPermissions up
            WHERE up.UserId = u.UserId AND up.Module = 'Expenses'
        );
END
GO
