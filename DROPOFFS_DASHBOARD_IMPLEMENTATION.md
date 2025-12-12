# Dynamic Dropoffs Dashboard Implementation

## Overview

This implementation makes the "Pending Issues" overview card dynamic to show the count of cars dropped off today, with full API layer integration and database stored procedure.

## Changes Made

### 1. Database Layer

**File**: `database/spGetDropoffsTodayCount.sql`

- Created stored procedure `spGetDropoffsTodayCount` to count cars with drop-off date today
- Filters by `DropOffDate` and `IsActive = 1`
- Returns a single count value with column name `Dropoff`

**Action Required**: Execute this SQL script on your database to create the stored procedure.

### 2. API Backend Layer

#### Constants

**File**: `api/src/constants/stored-procedures.ts`

- Added `GET_DROPOFFS_TODAY_COUNT = 'spGetDropoffsTodayCount'` to `BOOKING_STORED_PROCEDURES` enum

#### Service Layer

**File**: `api/src/services/booking.ts`

- Added `getDropoffsTodayCount()` method to `IBookingService` interface
- Implemented `getDropoffsTodayCount()` method in `BookingService` class
- Calls the stored procedure and returns the count

#### API Routes

**File**: `api/src/api/routes/bookings.ts`

- Added new route: `GET /bookings/dropoffs/today/count`
- Returns the count of cars with drop-off date today

### 3. Client-Side Layer

#### API Client

**File**: `client/src/api/booking/index.ts`

- Added `GetDropoffsTodayCountResponse` type
- Added `getDropoffsTodayCount()` method to `IBookingApi` interface
- Implemented `getDropoffsTodayCount()` in `BookingApi` class
- Handles both mock data and real API calls
- For mock data: filters by `DropOffDate` matching today
- For real API: calls `/bookings/dropoffs/today/count` endpoint

#### Custom Hook

**File**: `client/src/hooks/bookings/use-dropoffs-today-count.ts`

- Created new custom hook `useDropoffsTodayCount()`
- Fetches drop-off count on component mount
- Returns: `{ count, isLoading, refetch }`
- Provides loading state and ability to refresh data

#### UI Component

**File**: `client/src/sections/dashboard/overview/overview-pending-issues.tsx`

- Updated to use `useDropoffsTodayCount()` hook
- Changed label from "Pending Issues" to "Cars Dropped Off Today"
- Added loading spinner (`CircularProgress`) while fetching data
- Made `amount` prop optional (defaults to fetched count)
- Updated button text to "See all bookings"
- Added navigation link to bookings page

#### Dashboard Page

**File**: `client/src/pages/dashboard/index.tsx`

- Removed hardcoded `amount={12}` prop
- Component now fetches data dynamically

## Database Setup

Run the following SQL script on your database:

```sql
CREATE PROCEDURE [dbo].[spGetDropoffsTodayCount]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TodayStart DATETIME = CAST(GETDATE() AS DATE);
    DECLARE @TodayEnd DATETIME = DATEADD(DAY, 1, @TodayStart);

    SELECT COUNT(*) AS Dropoff
    FROM Booking
    WHERE DropOffDate >= @TodayStart
      AND DropOffDate < @TodayEnd
      AND IsActive = 1;
END
GO
```

## Testing

### With Mock Data

The application will work with mock data (in development mode) by filtering bookings where `DropOffDate` matches today's date.

### With Real Database

1. Ensure the stored procedure is created in your database
2. Set environment to use real API (not mock data)
3. The component will fetch the actual count from the database

## API Endpoints

### New Endpoint

```
GET /bookings/dropoffs/today/count
```

**Response:**

```json
{
  "data": {
    "Dropoff": 3
  },
  "success": true
}
```

## Features

- ✅ Real-time drop-off count for today
- ✅ Loading state with spinner
- ✅ Error handling
- ✅ Mock data support for development
- ✅ Navigation to bookings list page
- ✅ Responsive design
- ✅ TypeScript type safety throughout the stack

## Dashboard Overview Cards Summary

Now you have two dynamic overview cards:

1. **Bookings Done Today** - Shows count of bookings created today (by `CreatedOn` date)
2. **Cars Dropped Off Today** - Shows count of bookings with drop-off date today (by `DropOffDate`)

Both cards:

- Fetch real-time data from the database
- Show loading spinners during data fetch
- Handle errors gracefully
- Work with mock data in development
- Link to the bookings page

## Notes

- The stored procedure counts bookings by `DropOffDate` (scheduled drop-off date)
- Only active bookings (`IsActive = 1`) are counted
- The component refreshes data on mount
- The hook can be reused in other components if needed
- Both hooks follow the same pattern for consistency
