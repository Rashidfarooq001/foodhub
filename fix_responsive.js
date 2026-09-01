const fs = require("fs");

function fixResponsive(path) {
  let c = fs.readFileSync(path, "utf8");

  // Fix all <div className="flex gap-2"> to become responsive columns on mobile
  c = c.replace(/<div className="flex gap-2">/g, "<div className=\"flex flex-col sm:flex-row gap-2 sm:gap-3\">");

  // Fix button widths
  c = c.replace(/className="rounded-2xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50 shrink-0"/g, "className=\"w-full sm:w-auto shrink-0 flex items-center justify-center rounded-2xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50\"");
  c = c.replace(/className="flex items-center gap-1 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 shrink-0"/g, "className=\"w-full sm:w-auto shrink-0 flex items-center justify-center gap-1 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-200\"");

  // Customer web buttons
  c = c.replace(/className="shrink-0 rounded-2xl bg-orange-100 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-200 transition disabled:opacity-50"/g, "className=\"w-full sm:w-auto shrink-0 flex items-center justify-center rounded-2xl bg-orange-100 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-200 transition disabled:opacity-50\"");
  c = c.replace(/className="shrink-0 flex items-center justify-center rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700"/g, "className=\"w-full sm:w-auto shrink-0 flex items-center justify-center rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700\"");

  // State/PIN fields with w-1/2
  c = c.replace(/className="w-1\/2 /g, "className=\"w-full sm:w-1/2 ");

  fs.writeFileSync(path, c);
}

fixResponsive("apps/hotel-dashboard/src/app/partner/register/page.tsx");
fixResponsive("apps/customer-web/src/app/driver/register/page.tsx");
console.log("Fixed responsive layouts");

