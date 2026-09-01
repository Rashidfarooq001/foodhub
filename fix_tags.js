const fs = require("fs");
let path = "apps/hotel-dashboard/src/app/partner/register/page.tsx";
let c = fs.readFileSync(path, "utf8");

c = c.replace(/<h2 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider(.*?)>([\s\S]*?)<\/div>/g, "<h2 className=\"flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider$1>$2</h2>");

fs.writeFileSync(path, c);
console.log("Fixed hotel-dashboard");

