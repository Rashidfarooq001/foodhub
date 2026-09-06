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

console.log(parseTime('09:00 AM'));
console.log(parseTime('11:00 PM'));
console.log(parseTime('12:00 PM'));
console.log(parseTime('12:30 AM'));
console.log(parseTime('15:00'));
