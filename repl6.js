const fs = require("fs");
let code = fs.readFileSync("apps/hotel-dashboard/src/app/partner/register/page.tsx", "utf8");

const regex = /<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">[\s\S]*?\{!isPhoneVerified \? \([\s\S]*?<\/span>\s*\)\}\s*<\/div>/;

const replace = `<div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-2xl border border-gray-200 py-2 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>`;

if(regex.test(code)){
  code = code.replace(regex, replace);
  fs.writeFileSync("apps/hotel-dashboard/src/app/partner/register/page.tsx", code);
  console.log("done");
} else {
  console.log("Not found regex");
}
