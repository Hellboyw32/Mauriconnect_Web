USE [CarBooking]
GO
/****** Object:  StoredProcedure [dbo].[spGetCarCategoryDistribution]    Script Date: 12/16/2025 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[spGetCarCategoryDistribution]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cc.Category,
        COUNT(c.CarId) as TotalCars
    FROM 
        CarCategory cc
        LEFT JOIN Cars c ON cc.CategoryId = c.CategoryId AND c.IsActive = 1
    WHERE 
        cc.IsActive = 1
    GROUP BY 
        cc.Category, cc.CategoryId
    ORDER BY 
        cc.CategoryId;
END
GO
