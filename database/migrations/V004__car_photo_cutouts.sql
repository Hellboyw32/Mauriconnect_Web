SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
/*
  Car photos as cut-outs on a transparent background (WebP), so no foreign street or showroom
  shows behind the cars. Only replaces the photos set by V003, never an image set by the business.
*/
UPDATE rental.CarModels
SET ImageUrl = N'/cars/' + Slug + N'.webp'
WHERE ImageUrl = N'/cars/' + Slug + N'.jpg'
  AND Slug IN ('suzuki-s-presso', 'hyundai-grand-i10', 'nissan-march', 'toyota-vitz', 'suzuki-swift', 'hyundai-accent',
               'nissan-almera', 'suzuki-ciaz', 'suzuki-ertiga', 'toyota-rush', 'hyundai-creta');
GO
