const fs = require('fs');
const path = 'apps/customer-web/src/app/orders/[id]/track/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The syntax error is because there's an extra `</div>` or missing wrapper.
// Let's replace the whole header segment to be safe.
const brokenRegex =
  /\{order\.status === 'DELIVERED'\s*\?\s*\([\s\S]*?\)\s*:\s*\(\s*<div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-3 text-orange-800 ring-1 \r?\n?ring-orange-200">[\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*<\/div>/;

// Replace it with clean structure
content = content.replace(
  brokenRegex,
  `{order.status === 'DELIVERED' ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-800 ring-1 ring-emerald-200">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">Status</p>
              <p className="text-sm font-black">Delivered o"</p>
            </div>
          </div>
        ) : isDriverAssigned ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-800 ring-1 ring-emerald-200">
            <Clock className="h-5 w-5 animate-spin text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">Estimated Arrival</p>
              <p className="text-base font-black">{serverEtaMins ? \`\${serverEtaMins} Minutes\` : 'Calculating...'}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-3 text-orange-800 ring-1 ring-orange-200">
            <Clock className="h-5 w-5 animate-spin text-orange-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-orange-600">Status</p>
              <p className="text-xs font-black">Waiting for delivery partner</p>
            </div>
          </div>
        )}
      </div>`,
);

fs.writeFileSync(path, content, 'utf8');
