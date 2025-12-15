-- =============================================
-- Author:		Auto-generated
-- Create date: 2025-12-13
-- Description:	Get single car details by ID
-- =============================================
CREATE PROCEDURE [dbo].[spGetSingleCarDetailsJson]
    @CarId INT
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
        c.LastModifiedTimeStamp,
        c.LastModifiedUserId,
        (
            SELECT
                ct.CategoryId,
                ct.Category
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ) AS CarCategory
    FROM Cars c 
    JOIN CarCategory ct ON c.CategoryId = ct.CategoryId
    WHERE c.CarId = @CarId
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END
GO
