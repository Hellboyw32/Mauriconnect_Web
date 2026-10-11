// Parses a yyyy-MM-dd (or full ISO) string as a *local* date. new Date('2026-10-10')
// is read as UTC midnight, which displays as the previous day west of UTC.
export const toLocalDate = (value: string): Date => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};
