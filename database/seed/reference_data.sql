SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
/*
  Reference data taken from mauriconnect.com (reviewed 2026-10-30) plus clearly marked placeholders.
  Safe to re-run: rows are matched on their natural keys.

  PLACEHOLDERS - confirm before going live:
    * Car-to-category mapping (the site lists categories but does not assign cars to them)
    * Extras prices (the site does not publish them)
    * Cancellation policy (the site does not publish one)
    * Delivery fees (the site says delivery is free)
*/
SET NOCOUNT ON;

MERGE rental.Settings AS t
USING (VALUES
    ('MinRentalDays',     N'3',     N'Minimum rental length in days (FAQ: 3 days).'),
    ('MaxRentalDays',     N'90',    N'Maximum rental length bookable online.'),
    ('GraceMinutes',      N'59',    N'Minutes allowed past a full 24 h block before another day is charged.'),
    ('HoldMinutes',       N'30',    N'How long an unpaid booking holds a car.'),
    ('MinLeadHours',      N'24',    N'Earliest pickup, in hours from now.'),
    ('TurnaroundMinutes', N'0',     N'Buffer between two rentals of the same car.'),
    ('OpeningTime',       N'08:00', N'Office opening time (Mauritius time).'),
    ('ClosingTime',       N'18:00', N'Office closing time (Mauritius time).'),
    ('OutOfHoursFee',     N'0',     N'Fee in EUR for each pickup or return outside opening hours.')
) AS s (SettingKey, SettingValue, Description)
ON t.SettingKey = s.SettingKey
WHEN NOT MATCHED THEN INSERT (SettingKey, SettingValue, Description) VALUES (s.SettingKey, s.SettingValue, s.Description);

MERGE rental.CarCategories AS t
USING (VALUES
    (N'Mini',         'mini',         N'Compact city cars, easy to park.', 1),
    (N'Economy',      'economy',      N'Great value hatchbacks for couples and small families.', 2),
    (N'Intermediate', 'intermediate', N'Comfortable saloons with more boot space.', 3),
    (N'Full Size',    'full-size',    N'7-seaters and SUVs for families and groups.', 4)
) AS s (CategoryName, Slug, Description, DisplayOrder)
ON t.Slug = s.Slug
WHEN NOT MATCHED THEN INSERT (CategoryName, Slug, Description, DisplayOrder) VALUES (s.CategoryName, s.Slug, s.Description, s.DisplayOrder);

MERGE rental.CarModels AS t
USING (
    SELECT s.Slug, c.CarCategoryId, s.ModelName, s.Description, s.Passengers, s.Doors, s.Bags, s.ImageUrl, s.DisplayOrder
    FROM (VALUES
        ('suzuki-s-presso',   'mini',         N'Suzuki S-Presso',   N'Nimble mini car with a high driving position.', 5, 4, 1, N'/cars/suzuki-s-presso.webp', 1),
        ('hyundai-grand-i10', 'economy',      N'Hyundai Grand i10', N'Comfortable and economical five-door hatchback.', 5, 5, 1, N'/cars/hyundai-grand-i10.webp', 1),
        ('nissan-march',      'economy',      N'Nissan March',      N'Easy-going hatchback, ideal for island roads.', 5, 4, 1, N'/cars/nissan-march.webp', 2),
        ('toyota-vitz',       'economy',      N'Toyota Vitz',       N'Reliable and fuel efficient five-door hatchback.', 5, 5, 1, N'/cars/toyota-vitz.webp', 3),
        ('suzuki-swift',      'economy',      N'Suzuki Swift',      N'Lively hatchback with a modern cabin.', 5, 4, 1, N'/cars/suzuki-swift.webp', 4),
        ('hyundai-accent',    'intermediate', N'Hyundai Accent',    N'Spacious saloon with a generous boot.', 5, 5, 2, N'/cars/hyundai-accent.webp', 1),
        ('nissan-almera',     'intermediate', N'Nissan Almera',     N'Roomy saloon for longer trips around the island.', 5, 5, 2, N'/cars/nissan-almera.webp', 2),
        ('suzuki-ciaz',       'intermediate', N'Suzuki Ciaz',       N'Comfortable saloon with plenty of legroom.', 5, 5, 2, N'/cars/suzuki-ciaz.webp', 3),
        ('suzuki-ertiga',     'full-size',    N'Suzuki Ertiga',     N'Seven-seat people carrier for families and groups.', 7, 5, 3, N'/cars/suzuki-ertiga.webp', 1),
        ('toyota-rush',       'full-size',    N'Toyota Rush',       N'Seven-seat compact SUV with high ground clearance.', 7, 4, 3, N'/cars/toyota-rush.webp', 2),
        ('hyundai-creta',     'full-size',    N'Hyundai Creta',     N'Modern compact SUV with a large boot.', 5, 5, 3, N'/cars/hyundai-creta.webp', 3)
    ) AS s (Slug, CategorySlug, ModelName, Description, Passengers, Doors, Bags, ImageUrl, DisplayOrder)
    JOIN rental.CarCategories c ON c.Slug = s.CategorySlug
) AS s
ON t.Slug = s.Slug
WHEN NOT MATCHED THEN INSERT (Slug, CarCategoryId, ModelName, Description, Transmission, FuelType, PassengerCapacity, DoorCount, LuggageCapacity, HasAirConditioning, ImageUrl, DisplayOrder)
    VALUES (s.Slug, s.CarCategoryId, s.ModelName, s.Description, 'Automatic', 'Petrol', s.Passengers, s.Doors, s.Bags, 1, s.ImageUrl, s.DisplayOrder);

-- "From" daily rates shown on mauriconnect.com, applied all year until seasonal rates are confirmed.
-- The live site shows no price for Grand i10, March, Vitz, Swift on the reservation page; the home page shows EUR 24.
INSERT INTO rental.CarPricing (CarModelId, RangeStart, RangeEnd, DailyRate)
SELECT m.CarModelId, '2026-01-01', '2030-12-31', s.Rate
FROM (VALUES
    ('suzuki-s-presso', 20.00), ('hyundai-grand-i10', 24.00), ('nissan-march', 24.00), ('toyota-vitz', 24.00),
    ('suzuki-swift', 24.00), ('hyundai-accent', 30.00), ('nissan-almera', 30.00), ('suzuki-ciaz', 30.00),
    ('suzuki-ertiga', 43.00), ('toyota-rush', 43.00), ('hyundai-creta', 45.00)
) AS s (Slug, Rate)
JOIN rental.CarModels m ON m.Slug = s.Slug
WHERE NOT EXISTS (SELECT 1 FROM rental.CarPricing p WHERE p.CarModelId = m.CarModelId);

MERGE rental.RentalLocations AS t
USING (VALUES
    ('ssr-airport',     N'SSR Intl Airport',                   'Office',       N'Sir Seewoosagur Ramgoolam International Airport, Plaine Magnien, Mauritius', 0, 1),
    ('hotel-north',     N'Hotel Delivery – North Mauritius',   'DeliveryZone', NULL, 1, 2),
    ('hotel-east',      N'Hotel Delivery – East Mauritius',    'DeliveryZone', NULL, 1, 3),
    ('hotel-south',     N'Hotel Delivery – South Mauritius',   'DeliveryZone', NULL, 1, 4),
    ('hotel-west',      N'Hotel Delivery – West Mauritius',    'DeliveryZone', NULL, 1, 5),
    ('island-delivery', N'Island Wide Delivery – Mauritius',   'DeliveryZone', NULL, 1, 6)
) AS s (Code, LocationName, LocationType, Address, RequiresAddress, DisplayOrder)
ON t.Code = s.Code
WHEN NOT MATCHED THEN INSERT (Code, LocationName, LocationType, Address, DeliveryFee, RequiresAddress, DisplayOrder)
    VALUES (s.Code, s.LocationName, s.LocationType, s.Address, 0, s.RequiresAddress, s.DisplayOrder);

-- PLACEHOLDER prices: the business records these extras on bookings but does not publish prices.
MERGE rental.Extras AS t
USING (VALUES
    ('full-insurance', N'Full insurance (SCDW)', N'Reduces your excess. Keys, tyres, mirrors and personal belongings are not covered.', 'PerDay', 8.00, NULL, 1, 1),
    ('gps',            N'GPS navigation',         N'Portable GPS unit with Mauritius maps.', 'PerDay', 3.00, 30.00, 1, 2),
    ('child-seat',     N'Child car seat',         N'For children from 9 to 18 kg.', 'PerDay', 3.00, 30.00, 2, 3),
    ('booster-seat',   N'Booster seat',           N'For children from 15 to 36 kg.', 'PerDay', 2.00, 20.00, 2, 4)
) AS s (Code, Name, Description, PricingType, Price, MaxCharge, MaxQuantity, DisplayOrder)
ON t.Code = s.Code
WHEN NOT MATCHED THEN INSERT (Code, Name, Description, PricingType, Price, MaxCharge, MaxQuantity, DisplayOrder)
    VALUES (s.Code, s.Name, s.Description, s.PricingType, s.Price, s.MaxCharge, s.MaxQuantity, s.DisplayOrder);

-- PLACEHOLDER policy: free cancellation 48 h or more before pickup, 50 % fee inside 48 h.
IF NOT EXISTS (SELECT 1 FROM rental.CancellationPolicies)
BEGIN
    INSERT INTO rental.CancellationPolicies (Name) VALUES (N'Standard');
    DECLARE @policyId int = SCOPE_IDENTITY();
    INSERT INTO rental.CancellationPolicyRules (PolicyId, HoursBeforePickup, FeePercent)
    VALUES (@policyId, 48, 0), (@policyId, 0, 50);
END;
