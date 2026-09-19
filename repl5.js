const fs = require("fs");
let code = fs.readFileSync("apps/hotel-dashboard/src/app/partner/register/page.tsx", "utf8");

const target = `<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        disabled={isVerifyingPhone}
                        placeholder="10-digit mobile number"
                        
                        className="w-full rounded-2xl border border-gray-200 py-2 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none disabled:bg-gray-100"
                      />
                    </div>
                    {!isPhoneVerified ? (
                      <button
                        type="button"
                        onClick={handleVerifyPhoneWithWidget}
                        disabled={isVerifyingPhone}
                        className="w-full sm:w-auto shrink-0 flex items-center justify-center rounded-2xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        {isVerifyingPhone ? "Verifying..." : "Verify Phone Number"}
                      </button>
                    ) : (
                      <span className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-200">
                        <Check className="h-4 w-4" /> Verified
                      </span>
                    )}
                  </div>`;

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

if(code.includes(target)){
  code = code.replace(target, replace);
  fs.writeFileSync("apps/hotel-dashboard/src/app/partner/register/page.tsx", code);
  console.log("done");
} else {
  console.log("Not found");
}
