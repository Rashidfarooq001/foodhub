const fs = require('fs');

let content = fs.readFileSync('apps/customer-web/src/app/orders/[id]/page.tsx', 'utf8');

const regex = /\{showSupportModal && \([\s\S]*?Submit Ticket[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;
const newModal = `{showSupportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
                <h3 className="text-lg font-black text-gray-900">Need Help with Order #{order.orderNumber}?</h3>
                <p className="text-sm text-gray-600">
                  If you have an issue with this order, please email our support team directly. We typically respond within 2-4 hours.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowSupportModal(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl">
                    Close
                  </button>
                  <a
                    href={"mailto:businesscity05@gmail.com?subject=Help with Order " + order.orderNumber}
                    className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 flex items-center justify-center"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          )}`;

if (content.match(regex)) {
    content = content.replace(regex, newModal);
    fs.writeFileSync('apps/customer-web/src/app/orders/[id]/page.tsx', content);
    console.log("Successfully replaced modal");
} else {
    console.log("Regex didn't match");
}
