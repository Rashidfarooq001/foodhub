const isOpenReq = true; // User wants to go online
const restaurant_isOpen = false; // Currently offline in DB
const isWithinHours = true; // We proved this is true

const isCurrentlyOpen = isWithinHours && restaurant_isOpen; // true && false = false
const isManuallyOffline = isWithinHours && !restaurant_isOpen; // true && true = true

const shouldThrow = isOpenReq && !isCurrentlyOpen && !isManuallyOffline; 
// true && !false && !true
// true && true && false = false
console.log('shouldThrow:', shouldThrow);
