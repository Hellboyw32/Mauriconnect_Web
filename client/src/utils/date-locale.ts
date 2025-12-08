import { format, type Locale } from 'date-fns';
import locale from 'date-fns/locale/en-US';

const formatDistanceLocale: Record<string, string> = {
  lessThanXSeconds: '{{count}}s',
  xSeconds: '{{count}}s',
  halfAMinute: '30s',
  lessThanXMinutes: '{{count}}m',
  xMinutes: '{{count}}m',
  aboutXHours: '{{count}}h',
  xHours: '{{count}}h',
  xDays: '{{count}}d',
  aboutXWeeks: '{{count}}w',
  xWeeks: '{{count}}w',
  aboutXMonths: '{{count}}m',
  xMonths: '{{count}}m',
  aboutXYears: '{{count}}y',
  xYears: '{{count}}y',
  overXYears: '{{count}}y',
  almostXYears: '{{count}}y'
};

export const customLocale: Locale = {
  ...locale,
  formatDistance: (token, count, options) => {
    options = options || {};

    const result = formatDistanceLocale[token].replace('{{count}}', count);

    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'in ' + result;
      } else {
        return result + ' ago';
      }
    }

    return result;
  }
};

export const timestampToDate = (timestamp: string | Date, includeTime?: boolean): string => {
  const date = new Date(timestamp);
  let dateFormat = 'dd/MM/yyyy';
  if (includeTime) dateFormat = 'dd/MM/yyyy KK:mm';
  return format(date, dateFormat);
};
