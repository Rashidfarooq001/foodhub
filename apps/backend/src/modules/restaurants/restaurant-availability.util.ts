import { RestaurantTiming } from '@prisma/client';

export function parseBusinessTime(timeStr: string): number {
  if (!timeStr) return 0;
  const t = timeStr.trim().toUpperCase();
  let hours = 0;
  let mins = 0;
  
  const isPM = t.includes('PM');
  const isAM = t.includes('AM');
  
  // Remove AM/PM and any invisible characters (like narrow no-break space \u202F)
  const cleanTime = t.replace(/[A-Z\s\u202F]/g, ''); 
  
  const [h, m] = cleanTime.split(':');
  hours = parseInt(h, 10) || 0;
  mins = parseInt(m, 10) || 0;
  
  if (isAM || isPM) {
    if (hours === 12) hours = 0;
    if (isPM) hours += 12;
  }
  
  return hours * 60 + mins;
}

export function getRestaurantAvailability(
  timings: RestaurantTiming[], 
  isOpen: boolean
): {
  isWithinHours: boolean;
  isCurrentlyOpen: boolean;
  isManuallyOffline: boolean;
  nextOpeningTime: string | null;
} {
  const tz = 'Asia/Kolkata';
  const now = new Date();
  
  // Get current dayOfWeek (0 = Sunday, 1 = Monday)
  const optionsDay: Intl.DateTimeFormatOptions = { timeZone: tz, weekday: 'short' };
  const dayStr = new Intl.DateTimeFormat('en-US', optionsDay).format(now);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDayOfWeek = dayMap[dayStr] ?? now.getDay();

  const optionsTime: Intl.DateTimeFormatOptions = { 
    timeZone: tz, 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  };
  const currentTimeStr = new Intl.DateTimeFormat('en-GB', optionsTime).format(now);
  const currentMins = parseBusinessTime(currentTimeStr);

  let isWithinHours = false;
  const todaysTimings = timings.find(t => t.dayOfWeek === currentDayOfWeek);
  
  if (todaysTimings && !todaysTimings.isClosed) {
    const openMins = parseBusinessTime(todaysTimings.openTime);
    const closeMins = parseBusinessTime(todaysTimings.closeTime);
    if (closeMins < openMins) {
      if (currentMins >= openMins || currentMins <= closeMins) {
        isWithinHours = true;
      }
    } else {
      if (currentMins >= openMins && currentMins <= closeMins) {
        isWithinHours = true;
      }
    }
  } else {
    const prevDay = (currentDayOfWeek + 6) % 7;
    const yesterdaysTimings = timings.find(t => t.dayOfWeek === prevDay);
    if (yesterdaysTimings && !yesterdaysTimings.isClosed) {
      const yOpen = parseBusinessTime(yesterdaysTimings.openTime);
      const yClose = parseBusinessTime(yesterdaysTimings.closeTime);
      if (yClose < yOpen && currentMins <= yClose) {
        isWithinHours = true;
      }
    }
  }

  let nextOpeningTime = null;
  if (!isWithinHours) {
    nextOpeningTime = todaysTimings && !todaysTimings.isClosed ? todaysTimings.openTime : null;
  }

  const isCurrentlyOpen = isWithinHours && isOpen;
  const isManuallyOffline = isWithinHours && !isOpen;

  return {
    isWithinHours,
    isCurrentlyOpen,
    isManuallyOffline,
    nextOpeningTime,
  };
}
