const fs = require('fs');
const file = 'apps/hotel-dashboard/src/app/partner/register/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '{/* Phone & OTP Verification */}';
const endStr = '{/* OTP Verification Card */}';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log('Not found');
  process.exit(1);
}

const replacement = 
                {/* Phone Number Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Phone Number <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <div className="relative">
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
                  </div>
                </div>

              ;

content = content.substring(0, startIndex) + replacement.trimStart() + content.substring(endIndex);
fs.writeFileSync(file, content);
console.log('Replaced successfully');
