import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DayPilot } from '@daypilot/daypilot-lite-react';
import type { SchedulerData } from '@libs/types';

import { schedulerApi } from 'src/api/scheduler';

const EMPTY: SchedulerData = { categories: [], cars: [], bookings: [] };

// DayPilot Lite does not render nested resource `children`, so each category
// becomes a flat, styled "header" row followed by that category's cars.
// event.resource must be === resource.id, so both are strings.
// Display order of the categories; anything not listed goes after, alphabetically.
const CATEGORY_ORDER = ['mini', 'economy', 'intermediate', 'fullsize'];

const categoryRank = (name: string) => {
  const rank = CATEGORY_ORDER.indexOf(name.trim().toLowerCase());
  return rank === -1 ? CATEGORY_ORDER.length : rank;
};

// Bookings carry pickup/drop-off times, so a same-day handover (10:00 drop-off,
// 09:00 pickup) counts as an overlap and the scheduler gives that car's whole row
// a second line. Snapping both ends to midday of their date keeps handovers on
// one line while the bar still spans the pickup and drop-off cells.
const toMidday = (dateTime: string) => `${dateTime.slice(0, 10)}T12:00:00`;

// Bar colour by where a booking sits relative to now: past = red,
// active (in progress) = green, upcoming = yellow. Yellow gets dark text for contrast.
const bookingColors = (pickUpDate: string, dropOffDate: string) => {
  const now = Date.now();

  if (new Date(dropOffDate).getTime() < now) {
    return { backColor: '#ef4444', fontColor: '#ffffff' };
  }

  if (new Date(pickUpDate).getTime() > now) {
    return { backColor: '#facc15', fontColor: '#1f2937' };
  }

  return { backColor: '#22c55e', fontColor: '#ffffff' };
};

export const categoryResourceId = (categoryId: number) => `category-${categoryId}`;

export const useSchedulerData = () => {
  const [data, setData] = useState<SchedulerData>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const toggleCategory = useCallback((categoryId: number) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (!next.delete(categoryId)) {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setData(await schedulerApi.getSchedulerData());
    } catch (err) {
      setError(err?.message || 'Failed to load the schedule');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resources = useMemo<DayPilot.ResourceData[]>(() => {
    const rows: DayPilot.ResourceData[] = [];

    const sortedCategories = [...data.categories].sort(
      (a, b) =>
        categoryRank(a.CategoryName) - categoryRank(b.CategoryName) ||
        a.CategoryName.localeCompare(b.CategoryName)
    );

    sortedCategories.forEach((category) => {
      const cars = data.cars.filter((car) => car.CategoryId === category.CategoryId);
      if (!cars.length) {
        return;
      }

      const isCollapsed = collapsed.has(category.CategoryId);

      // The whole header row is a click target that toggles the category.
      rows.push({
        id: categoryResourceId(category.CategoryId),
        name: `${isCollapsed ? '▸' : '▾'}  ${category.CategoryName} (${cars.length})`,
        backColor: '#1e293b',
        fontColor: '#ffffff',
        areas: [
          {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            cursor: 'pointer',
            visibility: 'Visible',
            onClick: () => toggleCategory(category.CategoryId)
          }
        ]
      });

      if (isCollapsed) {
        return;
      }

      cars.forEach((car) => {
        rows.push({
          id: String(car.CarId),
          name: car.Model && car.Model !== car.CarNumber ? `${car.CarNumber} - ${car.Model}` : car.CarNumber
        });
      });
    });

    return rows;
  }, [data.categories, data.cars, collapsed, toggleCategory]);

  const events = useMemo<DayPilot.EventData[]>(
    () =>
      data.bookings.map((booking) => ({
        id: booking.BookingId,
        text: booking.CustomerName?.trim() || booking.ReferenceNo || `Booking ${booking.BookingId}`,
        start: toMidday(booking.PickUpDate),
        end: toMidday(booking.DropOffDate),
        resource: String(booking.CarId),
        ...bookingColors(booking.PickUpDate, booking.DropOffDate),
        toolTip: [
          booking.ReferenceNo && `Ref: ${booking.ReferenceNo}`,
          booking.FlightNo && `Flight: ${booking.FlightNo}`,
          booking.ContactDetails && `Contact: ${booking.ContactDetails}`,
          booking.NoShow && 'No show'
        ]
          .filter(Boolean)
          .join('\n')
      })),
    [data.bookings]
  );

  return { resources, events, isLoading, error, refetch: fetchData };
};
