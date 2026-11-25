SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
/*
  Customer ratings per car model.
  A real review must come from a booking (one review per booking), so only verified renters can rate.
  IsSample = 1 marks demo data for development; the API hides it unless SHOW_SAMPLE_REVIEWS is on,
  which is refused in production.
*/
CREATE TABLE rental.CarReviews (
    ReviewId      int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CarReviews PRIMARY KEY,
    CarModelId    int            NOT NULL CONSTRAINT FK_CarReviews_Model REFERENCES rental.CarModels (CarModelId),
    BookingId     int            NULL CONSTRAINT FK_CarReviews_Booking REFERENCES rental.Bookings (BookingId),
    Rating        tinyint        NOT NULL CONSTRAINT CK_CarReviews_Rating CHECK (Rating BETWEEN 1 AND 5),
    Comment       nvarchar(1000) NULL,
    IsSample      bit            NOT NULL CONSTRAINT DF_CarReviews_IsSample DEFAULT (0),
    IsPublished   bit            NOT NULL CONSTRAINT DF_CarReviews_IsPublished DEFAULT (1),
    CreatedAtUtc  datetime2(0)   NOT NULL CONSTRAINT DF_CarReviews_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_CarReviews_Verified CHECK (IsSample = 1 OR BookingId IS NOT NULL)
);
CREATE UNIQUE INDEX UX_CarReviews_Booking ON rental.CarReviews (BookingId) WHERE BookingId IS NOT NULL;
CREATE INDEX IX_CarReviews_Model ON rental.CarReviews (CarModelId) INCLUDE (Rating, IsSample, IsPublished);
GO
