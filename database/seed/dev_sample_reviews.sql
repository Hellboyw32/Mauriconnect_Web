SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
/*
  DEVELOPMENT / DEMO ONLY: 100-200 sample star ratings per car model, flagged IsSample = 1.
  They are not customer reviews. The migration runner refuses to load this file when
  NODE_ENV=production, and the API only shows sample ratings when SHOW_SAMPLE_REVIEWS=true
  (also refused in production). Remove them with: DELETE FROM rental.CarReviews WHERE IsSample = 1;
*/
SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM rental.CarReviews WHERE IsSample = 1)
BEGIN
    -- Each model gets a stable count (100-200) and a share of 5-star ratings (45-62 %).
    WITH models AS (
        SELECT CarModelId,
               100 + ABS(CHECKSUM(Slug)) % 101 AS ReviewCount,
               45 + ABS(CHECKSUM(REVERSE(Slug))) % 18 AS FiveStarPercent
        FROM rental.CarModels
        WHERE IsActive = 1
    ),
    numbers AS (
        SELECT TOP (200) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n FROM sys.all_objects
    ),
    draws AS (
        SELECT m.CarModelId, m.FiveStarPercent, ABS(CHECKSUM(NEWID())) % 100 AS r, ABS(CHECKSUM(NEWID())) % 540 AS AgeDays
        FROM models m
        JOIN numbers x ON x.n <= m.ReviewCount
    )
    INSERT INTO rental.CarReviews (CarModelId, BookingId, Rating, Comment, IsSample, CreatedAtUtc)
    SELECT CarModelId, NULL,
           CASE WHEN r < FiveStarPercent THEN 5
                WHEN r < FiveStarPercent + 26 THEN 4
                WHEN r < FiveStarPercent + 33 THEN 3
                WHEN r < FiveStarPercent + 36 THEN 2
                ELSE 1 END,
           NULL, 1, DATEADD(DAY, -AgeDays, SYSUTCDATETIME())
    FROM draws;
END;
