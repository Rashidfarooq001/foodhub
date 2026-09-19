const fs = require('fs');
const file = 'apps/hotel-dashboard/src/app/partner/register/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">[\s\S]*?\{\!isPhoneVerified \? \([\s\S]*?<\/span>\s*\)\}\s*<\/div>/;

const replacement = <div className="relative">
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
                  </div>;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced successfully');
} else {
  console.log('Regex not found');
}
