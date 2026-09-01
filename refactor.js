const fs = require("fs");

function fix(path) {
  let c = fs.readFileSync(path, "utf8");

  c = c.replace(/<form onSubmit=\{handleSubmit\} className="space-y-8">/g, "<form onSubmit={handleSubmit} className=\"rounded-2xl border border-gray-100 bg-white p-5 shadow-xl space-y-6\">");
  
  c = c.replace(/<div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl space-y-6">/g, "<div className=\"space-y-4\">");
  c = c.replace(/<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">/g, "<div className=\"space-y-4\">");
  c = c.replace(/<div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl space-y-6">/g, "<div className=\"space-y-4\">");
  
  c = c.replace(/<div className="flex items-center gap-2 text-base font-black text-gray-900 border-b border-gray-100 pb-4">/g, "<h2 className=\"flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-2\">");
  c = c.replace(/<div className="flex items-center gap-2 text-base font-black text-gray-900">/g, "<h2 className=\"flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider\">");
  c = c.replace(/<div className="flex items-center justify-between border-b border-gray-100 pb-4">/g, "<div className=\"flex items-center justify-between border-b border-gray-100 pb-2 mb-2\">");
  c = c.replace(/<div className="flex items-center justify-between border-b border-gray-100 pb-3">/g, "<div className=\"flex items-center justify-between border-b border-gray-100 pb-2 mb-2\">");
  
  c = c.replace(/gap-6/g, "gap-4");
  c = c.replace(/py-3\.5/g, "py-2");
  
  c = c.replace(/<div className="mx-auto max-w-4xl space-y-8">/g, "<div className=\"mx-auto max-w-4xl space-y-4\">");
  
  fs.writeFileSync(path, c);
}

fix("apps/hotel-dashboard/src/app/partner/register/page.tsx");
fix("apps/customer-web/src/app/driver/register/page.tsx");
console.log("Done");
