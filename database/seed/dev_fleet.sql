SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
/*
  DEVELOPMENT ONLY: two fictitious cars per model so availability can be tested.
  Replace with the real fleet (registration numbers) in production.
*/
SET NOCOUNT ON;

INSERT INTO rental.Cars (CarModelId, RegistrationNumber)
SELECT m.CarModelId, CONCAT('DEV-', RIGHT('000' + CAST(m.CarModelId AS varchar(3)), 3), '-', n.n)
FROM rental.CarModels m
CROSS JOIN (VALUES (1), (2)) AS n (n)
WHERE NOT EXISTS (SELECT 1 FROM rental.Cars c WHERE c.CarModelId = m.CarModelId);
