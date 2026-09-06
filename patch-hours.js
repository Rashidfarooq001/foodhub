const fs = require('fs');
const path = 'apps/hotel-dashboard/src/app/business-hours/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Change the useState initial value to isClosed: true
const targetUseState = `  const [hours, setHours] = useState(
    DAYS.map((d) => ({
      day: d.day,
      dayOfWeek: d.dayOfWeek,
      open: '09:00 AM',
      close: '11:00 PM',
      isClosed: false,
    })),
  );`;

const newUseState = `  const [hours, setHours] = useState(
    DAYS.map((d) => ({
      day: d.day,
      dayOfWeek: d.dayOfWeek,
      open: '09:00 AM',
      close: '11:00 PM',
      isClosed: true,
    })),
  );`;

content = content.replace(targetUseState, newUseState);

// Also change the map default inside fetchTimings
const targetMap = `                  open: found?.openTime || '09:00 AM',
                  close: found?.closeTime || '11:00 PM',
                  isClosed: found ? found.isClosed : false,`;

const newMap = `                  open: found?.openTime || '09:00 AM',
                  close: found?.closeTime || '11:00 PM',
                  isClosed: found ? found.isClosed : true,`;

content = content.replace(targetMap, newMap);

fs.writeFileSync(path, content);
console.log('Patched BusinessHoursPage');
