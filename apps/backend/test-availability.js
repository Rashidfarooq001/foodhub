const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseBusinessTime(timeStr) {
  if (!timeStr) return 0;
  const t = timeStr.trim().toUpperCase();
  const isPM = t.includes('PM');
  const isAM = t.includes('AM');
  const cleanTime = t.replace(/[A-Z\s\u202F]/g, '');
  const [h, m] = cleanTime.split(':');
  let hours = parseInt(h, 10) || 0;
  const mins = parseInt(m, 10) || 0;
  if (isAM || isPM) {
    if (hours === 12) hours = 0;
    if (isPM) hours += 12;
  }
  return hours * 60 + mins;
}

async function test() {
  const r = await prisma.restaurant.findFirst({ include: { timings: true } });
  const tz = 'Asia/Kolkata';
  const now = new Date();
  const dayStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now);
  const dayMap = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const currentDayOfWeek = dayMap[dayStr];
  const currentTimeStr = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  const currentMins = parseBusinessTime(currentTimeStr);

  const todaysTimings = r.timings.find(t => t.dayOfWeek === currentDayOfWeek);
  const openMins = parseBusinessTime(todaysTimings.openTime);
  const closeMins = parseBusinessTime(todaysTimings.closeTime);
  const isWithinHours = currentMins >= openMins && currentMins <= closeMins;

  console.log('=== LIVE AVAILABILITY TEST ===');
  console.log('restaurantId     :', r.id);
  console.log('restaurantName   :', r.name);
  console.log('currentTimestamp :', now.toISOString());
  console.log('timezone         :', tz);
  console.log('localTime        :', currentTimeStr, '(' + currentMins + ' mins since midnight)');
  console.log('localDay         :', dayStr + ' (' + currentDayOfWeek + ')');
  console.log('businessHoursFound:', !!todaysTimings);
  console.log('openTime         :', todaysTimings.openTime, '(' + openMins + ' mins)');
  console.log('closeTime        :', todaysTimings.closeTime, '(' + closeMins + ' mins)');
  console.log('isWithinHours    :', isWithinHours);
  console.log('isOpen (DB)      :', r.isOpen);
  console.log('isCurrentlyOpen  :', isWithinHours && r.isOpen);
  console.log('decision         :', (isWithinHours && r.isOpen) ? 'OPEN' : isWithinHours ? 'WITHIN HOURS but MANUALLY OFFLINE' : 'OUTSIDE HOURS');
  console.log('toggle ONLINE    :', isWithinHours ? 'WOULD SUCCEED ✓' : 'WOULD FAIL (outside hours)');
  console.log('==============================');
}

test()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
