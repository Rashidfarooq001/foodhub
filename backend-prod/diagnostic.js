const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurantId = 'efcc61f1-7314-47a3-888e-aa14c1894c10'; // We use the test one

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { timings: true }
  });

  const tz = 'Asia/Kolkata';
  const now = new Date();
  
  const optionsDay = { timeZone: tz, weekday: 'short' };
  const dayStr = new Intl.DateTimeFormat('en-US', optionsDay).format(now);
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDayOfWeek = dayMap[dayStr] ?? now.getDay();

  const optionsTime = { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false };
  const currentTimeStr = new Intl.DateTimeFormat('en-GB', optionsTime).format(now);

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const t = timeStr.trim().toUpperCase();
    let hours = 0, mins = 0;
    if (t.includes('AM') || t.includes('PM')) {
      const [time, modifier] = t.split(' ');
      let [h, m] = time.split(':');
      hours = parseInt(h, 10) || 0;
      mins = parseInt(m, 10) || 0;
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
    } else {
      let [h, m] = t.split(':');
      hours = parseInt(h, 10) || 0;
      mins = parseInt(m, 10) || 0;
    }
    return hours * 60 + mins;
  };

  const currentMins = parseTime(currentTimeStr);

  let isWithinHours = false;
  const todaysTimings = restaurant.timings.find(t => t.dayOfWeek === currentDayOfWeek);
  
  if (todaysTimings && !todaysTimings.isClosed) {
    const openMins = parseTime(todaysTimings.openTime);
    const closeMins = parseTime(todaysTimings.closeTime);
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
    const yesterdaysTimings = restaurant.timings.find(t => t.dayOfWeek === prevDay);
    if (yesterdaysTimings && !yesterdaysTimings.isClosed) {
      const yOpen = parseTime(yesterdaysTimings.openTime);
      const yClose = parseTime(yesterdaysTimings.closeTime);
      if (yClose < yOpen && currentMins <= yClose) {
        isWithinHours = true;
      }
    }
  }

  const isCurrentlyOpen = isWithinHours && restaurant.isOpen;
  const isManuallyOffline = isWithinHours && !restaurant.isOpen;
  const throwsError = true && !isCurrentlyOpen && !isManuallyOffline;

  console.log('--- DIAGNOSTIC REPORT ---');
  console.log(`CURRENT DATE/TIME: ${now.toISOString()}`);
  console.log(`CURRENT DAY: ${dayStr} (Index ${currentDayOfWeek})`);
  console.log(`TIMEZONE: ${tz}`);
  console.log(`ONLINE VALIDATION CURRENT TIME: ${currentTimeStr} (${currentMins} mins)`);
  console.log(`DATABASE SCHEDULE: \n${JSON.stringify(restaurant.timings, null, 2)}`);
  console.log(`ONLINE VALIDATION READS: Day ${todaysTimings?.dayOfWeek} | Open ${todaysTimings?.openTime} | Close ${todaysTimings?.closeTime} | isClosed ${todaysTimings?.isClosed}`);
  console.log(`ENABLED (isClosed=false): ${todaysTimings ? !todaysTimings.isClosed : 'No Data'}`);
  console.log(`RESULT isWithinHours: ${isWithinHours}`);
  console.log(`RESULT isCurrentlyOpen: ${isCurrentlyOpen}`);
  console.log(`RESULT isManuallyOffline: ${isManuallyOffline}`);
  console.log(`THROWS ERROR: ${throwsError}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
