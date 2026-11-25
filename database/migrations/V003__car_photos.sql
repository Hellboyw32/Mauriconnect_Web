SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
/*
  Real photos for each model (Wikimedia Commons, freely licensed; credits on the website's /credits page).
  Only replaces the original placeholder drawings, never an image set by the business.
*/
UPDATE m
SET ImageUrl = N'/cars/' + m.Slug + N'.jpg'
FROM rental.CarModels m
WHERE m.ImageUrl IN (N'/cars/mini.svg', N'/cars/economy.svg', N'/cars/intermediate.svg', N'/cars/full-size.svg')
  AND m.Slug IN ('suzuki-s-presso', 'hyundai-grand-i10', 'nissan-march', 'toyota-vitz', 'suzuki-swift', 'hyundai-accent',
                 'nissan-almera', 'suzuki-ciaz', 'suzuki-ertiga', 'toyota-rush', 'hyundai-creta');
GO
