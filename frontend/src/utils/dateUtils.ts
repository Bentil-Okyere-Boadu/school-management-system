const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

export const calculateEventEndTime = (
  startDate: string,
  endDate: string | null | undefined,
  isAllDay: boolean,
): string => {
  if (endDate) return endDate;
  if (isAllDay) return startDate;
  
  const start = new Date(startDate);
  return new Date(start.getTime() + MILLISECONDS_PER_HOUR).toISOString();
};

export const calculateAllDayEventDuration = (
  startDate: Date,
  endDate: Date | null | undefined,
): number => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = endDate ? new Date(endDate) : start;
  end.setHours(23, 59, 59, 999);
  
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  return Math.round((endDay.getTime() - startDay.getTime()) / MILLISECONDS_PER_DAY);
};

export const formatDateForAllDay = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const formatDateForDateTime = (date: Date): string => {
  return date.toISOString().slice(0, 16);
};

export const setAllDayStartTime = (date: Date): void => {
  date.setHours(0, 0, 0, 0);
};

export const setAllDayEndTime = (date: Date): void => {
  date.setHours(23, 59, 59, 999);
};

