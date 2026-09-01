const fs = require("fs");
let path = "apps/customer-web/src/app/restaurant/register/page.tsx";
let c = fs.readFileSync(path, "utf8");

c = c.replace(/<div className="flex gap-2">/g, "<div className=\"flex flex-col sm:flex-row gap-2 sm:gap-3\">");
c = c.replace(/className="w-1\/2 /g, "className=\"w-full sm:w-1/2 ");

fs.writeFileSync(path, c);
console.log("Fixed restaurant register");

