const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const format = (value: number, unit: string) =>
  `${value} ${unit}${value === 1 ? '' : 's'} ago`;

export const timeAgo = (
  input: string | number | Date | null | undefined,
  now: Date = new Date(),
): string => {
  if (input === null || input === undefined) return '';

  const timestamp = new Date(input).getTime();
  if (Number.isNaN(timestamp)) return '';

  const seconds = Math.max(0, Math.floor((now.getTime() - timestamp) / 1000));

  if (seconds < MINUTE) return 'a second ago';
  if (seconds < HOUR) return format(Math.floor(seconds / MINUTE), 'min');
  if (seconds < DAY) return format(Math.floor(seconds / HOUR), 'hour');
  if (seconds < WEEK) return format(Math.floor(seconds / DAY), 'day');
  if (seconds < MONTH) return format(Math.floor(seconds / WEEK), 'week');
  if (seconds < YEAR) return format(Math.floor(seconds / MONTH), 'month');
  if (seconds < 2 * YEAR) return 'a year ago';

  return `more than ${Math.floor(seconds / YEAR)} years ago`;
};
