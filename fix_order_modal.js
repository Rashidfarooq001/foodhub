const fs = require('fs');

let content = fs.readFileSync('apps/customer-web/src/app/orders/[id]/page.tsx', 'utf8');

// Replace the modal logic
const oldModal = `{showSupportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl space-y-4">
                <h3 className="text-lg font-black text-gray-900">Need Help with Order #{order.orderNumber}?</h3>

                {supportSuccessMsg ? (
                  <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200">
                    ?? {supportSuccessMsg}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Issue Type</label>
                      <select
                        value={supportIssue}
                        onChange={(e) => setSupportIssue(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:outline-none"
                      >
                        <option value="Missing item">Missing item from order</option>
                        <option value="Wrong item">Wrong item delivered</option>
                        <option value="Food quality issue">Food quality / taste issue</option>
                        <option value="Delivery delay">Delivery delay</option>
                        <option value="Payment problem">Payment or refund inquiry</option>
                        <option value="Other">Other issue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={supportDescription}
                        onChange={(e) => setSupportDescription(e.target.value)}
                        placeholder="Explain what went wrong..."
                        className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setShowSupportModal(false)} className="px-4 py-2 text-xs font-bold text-gray-600">
                        Close
                      </button>
                      <button
                        onClick={handleSubmitSupport}
                        disabled={isSubmittingSupport}
                        className="rounded-2xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50"
                      >
                        Submit Ticket
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}`;

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
                    href={`mailto:businesscity05@gmail.com?subject=Help with Order ${order.orderNumber}`}
                    className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 flex items-center justify-center"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          )}`;

content = content.replace(oldModal, newModal);
fs.writeFileSync('apps/customer-web/src/app/orders/[id]/page.tsx', content);
