const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurantId = 'efcc61f1-7314-47a3-888e-aa14c1894c10';
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

  console.log(`CURRENT LOCAL TIME: ${now.toString()}`);
  console.log(`CURRENT DAY STR: ${dayStr} -> ${currentDayOfWeek}`);
  console.log(`CURRENT TIME STR: ${currentTimeStr} -> ${currentMins}`);
  
  let isWithinHours = false;
  const todaysTimings = restaurant.timings.find(t => t.dayOfWeek === currentDayOfWeek);
  
  if (todaysTimings) {
    console.log(`TODAY TIMINGS FOUND: Day ${todaysTimings.dayOfWeek}, Open: ${todaysTimings.openTime}, Close: ${todaysTimings.closeTime}, isClosed: ${todaysTimings.isClosed}`);
  } else {
    console.log(`NO TIMINGS FOUND FOR TODAY (Day ${currentDayOfWeek})`);
  }

  if (todaysTimings && !todaysTimings.isClosed) {
    const openMins = parseTime(todaysTimings.openTime);
    const closeMins = parseTime(todaysTimings.closeTime);
    console.log(`PARSED OPEN: ${openMins}, PARSED CLOSE: ${closeMins}`);
    
    if (closeMins < openMins) {
      if (currentMins >= openMins || currentMins <= closeMins) {
        isWithinHours = true;
      }
    } else {
      if (currentMins >= openMins && currentMins <= closeMins) {
        isWithinHours = true;
      }
    }
  }

  console.log(`RESULT isWithinHours: ${isWithinHours}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
