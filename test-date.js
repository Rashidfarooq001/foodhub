const tz = 'Asia/Kolkata';
const now = new Date();
const optionsTime = { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false };
const currentTimeStr = new Intl.DateTimeFormat('en-GB', optionsTime).format(now);
console.log(currentTimeStr);

const optionsDay = { timeZone: tz, weekday: 'short' };
const dayStr = new Intl.DateTimeFormat('en-US', optionsDay).format(now);
console.log(dayStr);
