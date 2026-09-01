const fs = require("fs");
let path = "apps/customer-web/src/app/driver/register/page.tsx";
let c = fs.readFileSync(path, "utf8");

let blockStart = c.indexOf("if (!isAuthEnabled()) {");
let blockEnd = c.indexOf("const [form, setForm]");
if (blockStart !== -1 && blockEnd !== -1) {
  c = c.substring(0, blockStart) + c.substring(blockEnd);
  fs.writeFileSync(path, c);
  console.log("Removed disabled block");
}
