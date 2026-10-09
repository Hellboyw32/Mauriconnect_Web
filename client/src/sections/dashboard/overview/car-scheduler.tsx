import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { addMonths, startOfDay } from 'date-fns';
import { DayPilot, DayPilotScheduler } from '@daypilot/daypilot-lite-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/paths';
import { useRouter } from 'src/hooks/use-router';
import { useSchedulerData } from 'src/hooks/scheduler/use-scheduler-data';

// Matches the window the api loads: 5 months back, 7 months ahead.
const MONTHS_BACK = 5;
const MONTHS_FORWARD = 7;

const MIN_HEIGHT = 300;

// Space left under the grid so its horizontal scrollbar is never cut off.
const BOTTOM_GAP = 90;

// Edge-to-edge scheduler: fills the area under the top bar with no padding.
export const CarScheduler = () => {
  const router = useRouter();
  const { resources, events, isLoading, error } = useSchedulerData();
  const schedulerRef = useRef<DayPilot.Scheduler | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(600);

  const today = startOfDay(new Date());
  const startDate = addMonths(today, -MONTHS_BACK);
  const days = Math.round(
    (addMonths(today, MONTHS_FORWARD).getTime() - startDate.getTime()) / 86400000
  );

  // Size the grid to exactly the space left below it, measured rather than
  // assumed, so the horizontal scrollbar at its bottom edge stays on screen.
  useLayoutEffect(() => {
    const fit = () => {
      const top = gridRef.current?.getBoundingClientRect().top ?? 0;
      setHeight(Math.max(Math.floor(window.innerHeight - top - BOTTOM_GAP), MIN_HEIGHT));
    };

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [error, isLoading]);

  // Bring today into view once data is there (the grid starts 5 months back).
  useEffect(() => {
    if (!isLoading && schedulerRef.current) {
      schedulerRef.current.scrollTo(new DayPilot.Date(today.toISOString()));
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEventClick = useCallback(
    (args: DayPilot.SchedulerEventClickArgs) => {
      router.push(paths.bookings.edit.replace(':bookingId', String(args.e.id())));
    },
    [router]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading && <LinearProgress />}
      <div ref={gridRef}>
        <DayPilotScheduler
          controlRef={(scheduler: DayPilot.Scheduler) => {
            schedulerRef.current = scheduler;
          }}
          timeHeaders={[{ groupBy: 'Month' }, { groupBy: 'Day', format: 'd' }]}
          scale="Day"
          days={days}
          startDate={new DayPilot.Date(startDate.toISOString())}
          cellWidth={40}
          rowHeaderWidth={200}
          eventHeight={22}
          rowMarginTop={1}
          rowMarginBottom={1}
          durationBarVisible={false}
          heightSpec="Fixed"
          height={height}
          eventMoveHandling="Disabled"
          eventResizeHandling="Disabled"
          resources={resources}
          events={events}
          onEventClick={handleEventClick}
        />
      </div>
    </Box>
  );
};
