USE [CarBooking]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- spSaveExpense: create ('Add') or update ('Update') an expense.
-- @RestrictToUserId: when set, an update only succeeds on a record created by
-- that user (used for Normal users so they can only edit their own expenses).
-- Returns the ExpenseId.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spSaveExpense]
    @Action VARCHAR(10),
    @ExpenseId INT = 0,
    @ExpenseDate DATE,
    @InvoiceNumber NVARCHAR(100) = NULL,
    @SupplierName NVARCHAR(200),
    @Description NVARCHAR(1000),
    @AmountExcludingVAT DECIMAL(18,2),
    @VATAmount DECIMAL(18,2),
    @Notes NVARCHAR(MAX) = NULL,
    @UserId INT = NULL,
    @Login VARCHAR(100),
    @RestrictToUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @ExpenseDate IS NULL
        THROW 50020, 'Expense date is required.', 1;
    IF NULLIF(LTRIM(RTRIM(@SupplierName)), '') IS NULL
        THROW 50020, 'Supplier name is required.', 1;
    IF NULLIF(LTRIM(RTRIM(@Description)), '') IS NULL
        THROW 50020, 'Description is required.', 1;
    IF @AmountExcludingVAT < 0 OR @VATAmount < 0
        THROW 50020, 'Amounts cannot be negative.', 1;

    IF @Action = 'Add'
    BEGIN
        INSERT INTO dbo.Expenses
            (ExpenseDate, InvoiceNumber, SupplierName, Description, AmountExcludingVAT, VATAmount,
             Notes, IsActive, CreatedByUserId, CreatedBy, CreatedDate)
        VALUES
            (@ExpenseDate, NULLIF(LTRIM(RTRIM(@InvoiceNumber)), ''), LTRIM(RTRIM(@SupplierName)),
             LTRIM(RTRIM(@Description)), @AmountExcludingVAT, @VATAmount,
             @Notes, 1, @UserId, @Login, GETDATE());

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS ExpenseId;
    END
    ELSE IF @Action = 'Update'
    BEGIN
        UPDATE dbo.Expenses
        SET ExpenseDate = @ExpenseDate,
            InvoiceNumber = NULLIF(LTRIM(RTRIM(@InvoiceNumber)), ''),
            SupplierName = LTRIM(RTRIM(@SupplierName)),
            Description = LTRIM(RTRIM(@Description)),
            AmountExcludingVAT = @AmountExcludingVAT,
            VATAmount = @VATAmount,
            Notes = @Notes,
            LastModifiedBy = @Login,
            LastModifiedDate = GETDATE()
        WHERE ExpenseId = @ExpenseId
            AND IsActive = 1
            AND (@RestrictToUserId IS NULL OR CreatedByUserId = @RestrictToUserId);

        IF @@ROWCOUNT = 0
            THROW 50021, 'Expense not found, or you do not have access to edit it.', 1;

        SELECT @ExpenseId AS ExpenseId;
    END
    ELSE
        THROW 50022, 'Invalid action.', 1;
END
GO

-- =============================================
-- spGetExpensesJson: filtered, sorted, paged list plus totals for the WHOLE
-- filtered set (not just the page). @CreatedByUserId restricts to one user's
-- records (Normal users); NULL = everyone (Admin). Returns one JSON object.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spGetExpensesJson]
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @Search NVARCHAR(200) = NULL,
    @Supplier NVARCHAR(200) = NULL,
    @CreatedByUserId INT = NULL,
    @Page INT = 0,
    @PageSize INT = 25,
    @SortDir VARCHAR(4) = 'desc'
AS
BEGIN
    SET NOCOUNT ON;

    SET @PageSize = CASE WHEN ISNULL(@PageSize, 0) < 1 THEN 25 WHEN @PageSize > 500 THEN 500 ELSE @PageSize END;
    SET @Page = CASE WHEN ISNULL(@Page, 0) < 0 THEN 0 ELSE @Page END;

    ;WITH f AS (
        SELECT e.*
        FROM dbo.Expenses e
        WHERE e.IsActive = 1
            AND (@FromDate IS NULL OR e.ExpenseDate >= @FromDate)
            AND (@ToDate IS NULL OR e.ExpenseDate <= @ToDate)
            AND (@Supplier IS NULL OR e.SupplierName = @Supplier)
            AND (@Search IS NULL
                 OR e.SupplierName LIKE '%' + @Search + '%'
                 OR e.InvoiceNumber LIKE '%' + @Search + '%')
            AND (@CreatedByUserId IS NULL OR e.CreatedByUserId = @CreatedByUserId)
    )
    SELECT
        (SELECT COUNT(*) FROM f) AS Total,
        (SELECT ISNULL(SUM(AmountExcludingVAT), 0) FROM f) AS TotalExcludingVAT,
        (SELECT ISNULL(SUM(VATAmount), 0) FROM f) AS TotalVAT,
        (SELECT ISNULL(SUM(TotalInvoiceAmount), 0) FROM f) AS TotalIncludingVAT,
        JSON_QUERY(ISNULL((
            SELECT
                x.ExpenseId, x.ExpenseDate, x.InvoiceNumber, x.SupplierName, x.Description,
                x.AmountExcludingVAT, x.VATAmount, x.TotalInvoiceAmount, x.Notes,
                x.CreatedByUserId, x.CreatedBy, x.CreatedDate, x.LastModifiedBy, x.LastModifiedDate,
                (SELECT COUNT(*) FROM dbo.ExpenseAttachments a
                  WHERE a.ExpenseId = x.ExpenseId AND a.IsActive = 1) AS AttachmentCount
            FROM f x
            ORDER BY
                CASE WHEN @SortDir = 'asc' THEN x.ExpenseDate END ASC,
                CASE WHEN @SortDir = 'asc' THEN x.ExpenseId END ASC,
                CASE WHEN @SortDir <> 'asc' THEN x.ExpenseDate END DESC,
                CASE WHEN @SortDir <> 'asc' THEN x.ExpenseId END DESC
            OFFSET @Page * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
            FOR JSON PATH
        ), '[]')) AS Items
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO

-- =============================================
-- spGetExpenseJson: one expense with its attachments. Returns one JSON object
-- (nothing if the expense does not exist / is deleted).
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spGetExpenseJson]
    @ExpenseId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.ExpenseId, e.ExpenseDate, e.InvoiceNumber, e.SupplierName, e.Description,
        e.AmountExcludingVAT, e.VATAmount, e.TotalInvoiceAmount, e.Notes,
        e.CreatedByUserId, e.CreatedBy, e.CreatedDate, e.LastModifiedBy, e.LastModifiedDate,
        JSON_QUERY(ISNULL((
            SELECT a.AttachmentId, a.FileName, a.ContentType, a.FileSize, a.UploadedBy, a.UploadedDate
            FROM dbo.ExpenseAttachments a
            WHERE a.ExpenseId = e.ExpenseId AND a.IsActive = 1
            ORDER BY a.UploadedDate, a.AttachmentId
            FOR JSON PATH
        ), '[]')) AS Attachments
    FROM dbo.Expenses e
    WHERE e.ExpenseId = @ExpenseId AND e.IsActive = 1
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO

-- =============================================
-- spGetExpenseSuppliersJson: distinct suppliers for the filter dropdown.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spGetExpenseSuppliersJson]
    @CreatedByUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT e.SupplierName
    FROM dbo.Expenses e
    WHERE e.IsActive = 1
        AND (@CreatedByUserId IS NULL OR e.CreatedByUserId = @CreatedByUserId)
    ORDER BY e.SupplierName
    FOR JSON PATH;
END
GO

-- =============================================
-- spCheckExpenseDuplicateJson: other live expenses with the same supplier and
-- invoice number. Used only to WARN - never blocks a save.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spCheckExpenseDuplicateJson]
    @SupplierName NVARCHAR(200),
    @InvoiceNumber NVARCHAR(100),
    @ExcludeExpenseId INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT e.ExpenseId, e.ExpenseDate, e.SupplierName, e.InvoiceNumber, e.TotalInvoiceAmount, e.CreatedBy
    FROM dbo.Expenses e
    WHERE e.IsActive = 1
        AND NULLIF(LTRIM(RTRIM(@InvoiceNumber)), '') IS NOT NULL
        AND e.SupplierName = LTRIM(RTRIM(@SupplierName))
        AND e.InvoiceNumber = LTRIM(RTRIM(@InvoiceNumber))
        AND e.ExpenseId <> ISNULL(@ExcludeExpenseId, 0)
    ORDER BY e.ExpenseDate DESC
    FOR JSON PATH;
END
GO

-- =============================================
-- spDeleteExpense: soft delete (keeps the audit trail and the documents).
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spDeleteExpense]
    @ExpenseId INT,
    @Login VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Expenses
    SET IsActive = 0,
        LastModifiedBy = @Login,
        LastModifiedDate = GETDATE()
    WHERE ExpenseId = @ExpenseId AND IsActive = 1;

    IF @@ROWCOUNT = 0
        THROW 50021, 'Expense not found.', 1;
END
GO

-- =============================================
-- Attachments
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spAddExpenseAttachment]
    @ExpenseId INT,
    @FileName NVARCHAR(260),
    @StoredFileName NVARCHAR(300),
    @FilePath NVARCHAR(600),
    @ContentType VARCHAR(100) = NULL,
    @FileSize INT = NULL,
    @UploadedBy VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Expenses WHERE ExpenseId = @ExpenseId AND IsActive = 1)
        THROW 50021, 'Expense not found.', 1;

    INSERT INTO dbo.ExpenseAttachments
        (ExpenseId, FileName, StoredFileName, FilePath, ContentType, FileSize, IsActive, UploadedBy, UploadedDate)
    VALUES
        (@ExpenseId, @FileName, @StoredFileName, @FilePath, @ContentType, @FileSize, 1, @UploadedBy, GETDATE());

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS AttachmentId;
END
GO

-- One attachment (including where the file is stored) for download/preview/delete.
CREATE OR ALTER PROCEDURE [dbo].[spGetExpenseAttachmentJson]
    @AttachmentId INT,
    @ExpenseId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT a.AttachmentId, a.ExpenseId, a.FileName, a.StoredFileName, a.FilePath, a.ContentType, a.FileSize
    FROM dbo.ExpenseAttachments a
    JOIN dbo.Expenses e ON e.ExpenseId = a.ExpenseId AND e.IsActive = 1
    WHERE a.AttachmentId = @AttachmentId AND a.ExpenseId = @ExpenseId AND a.IsActive = 1
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO

-- Soft delete: the row stays for audit; the caller removes the file separately.
CREATE OR ALTER PROCEDURE [dbo].[spDeleteExpenseAttachment]
    @AttachmentId INT,
    @ExpenseId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.ExpenseAttachments
    SET IsActive = 0
    WHERE AttachmentId = @AttachmentId AND ExpenseId = @ExpenseId AND IsActive = 1;

    IF @@ROWCOUNT = 0
        THROW 50021, 'Document not found.', 1;
END
GO

-- =============================================
-- spGetExpenseReportJson: MRA Table 2 style report for an invoice-date range.
-- Filters on ExpenseDate (the supplier invoice date), never on the entry date.
-- Returns { TotalExcludingVAT, TotalVAT, TotalIncludingVAT, Count, Rows: [...] }.
-- All recorded VAT is reported as entered - nothing is assumed recoverable.
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[spGetExpenseReportJson]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*) FROM dbo.Expenses WHERE IsActive = 1 AND ExpenseDate BETWEEN @FromDate AND @ToDate) AS [Count],
        (SELECT ISNULL(SUM(AmountExcludingVAT), 0) FROM dbo.Expenses WHERE IsActive = 1 AND ExpenseDate BETWEEN @FromDate AND @ToDate) AS TotalExcludingVAT,
        (SELECT ISNULL(SUM(VATAmount), 0) FROM dbo.Expenses WHERE IsActive = 1 AND ExpenseDate BETWEEN @FromDate AND @ToDate) AS TotalVAT,
        (SELECT ISNULL(SUM(TotalInvoiceAmount), 0) FROM dbo.Expenses WHERE IsActive = 1 AND ExpenseDate BETWEEN @FromDate AND @ToDate) AS TotalIncludingVAT,
        JSON_QUERY(ISNULL((
            SELECT
                e.ExpenseId, e.ExpenseDate AS InvoiceDate, e.InvoiceNumber, e.SupplierName,
                e.Description, e.AmountExcludingVAT, e.VATAmount, e.TotalInvoiceAmount
            FROM dbo.Expenses e
            WHERE e.IsActive = 1 AND e.ExpenseDate BETWEEN @FromDate AND @ToDate
            ORDER BY e.ExpenseDate, e.ExpenseId
            FOR JSON PATH
        ), '[]')) AS [Rows]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO
