const fs = require("fs");
let path = "apps/customer-web/src/components/layout/PartnerHeader.tsx";
let c = fs.readFileSync(path, "utf8");

c = c.replace(/<span>Help \/ Contact Support<\/span>/g, "<span className=\"hidden sm:inline\">Help / Contact Support</span>");
c = c.replace(/<span>Partner Login<\/span>/g, "<span className=\"hidden sm:inline\">Partner Login</span>");

fs.writeFileSync(path, c);
console.log("Fixed PartnerHeader text");

