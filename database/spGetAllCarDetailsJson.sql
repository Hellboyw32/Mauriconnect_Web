-- =============================================
-- Author:		Auto-generated
-- Create date: 2025-12-13
-- Description:	Get car details with filter support
-- =============================================
CREATE PROCEDURE [dbo].[spGetAllCarDetailsJson]
    @CarNumber VARCHAR(300) = NULL,
    @CategoryId INT = NULL
AS  
BEGIN  
    SET NOCOUNT ON;

    SELECT 
        c.CarId, 
        c.Model, 
        c.CarNumber, 
        c.Description,
        c.CurrentMileage,
        c.ServicingFrequency,
        c.LastServicedMileage,
        c.IsActive,
        c.SortOrder,
        JSON_QUERY((
            SELECT
                ct.CategoryId,
                ct.Category
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS CarCategory
    FROM Cars c 
    JOIN CarCategory ct ON c.CategoryId = ct.CategoryId
    WHERE c.IsActive = 1
        AND ct.IsActive = 1
        AND (@CarNumber IS NULL OR c.CarNumber LIKE '%' + @CarNumber + '%')
        AND (@CategoryId IS NULL OR c.CategoryId = @CategoryId)
    ORDER BY c.SortOrder, c.Model
    FOR JSON PATH;
END
GO
