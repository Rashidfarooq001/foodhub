const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

const startTag = '{/* PLACE-NAME LOCATION SEARCH MODAL';
const endTag = ' {/* END CUSTOM ADDRESS MODAL */}'; // Check if there's an end tag or just find the closing tags

const modalRegex = /\{\/\* PLACE-NAME LOCATION SEARCH MODAL[\s\S]*?\{\/\* Popular J&K Location Quick Pills \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const newModalUI = `{/* MANUAL ADDRESS MODAL */}
          {showCustomAddressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">
                      Change Delivery Location
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowCustomAddressModal(false)}
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
  
                {/* MANUAL TEXT ENTRY */}
                <div className="space-y-4">
                  {!matchedAddressResult ? (
                    <>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Delivery Address
                      </label>
                      <textarea
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="House 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir 193201"
                        rows={4}
                        disabled={isVerifyingAddress}
                        className="w-full rounded-2xl border border-gray-200 p-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-50 resize-none disabled:opacity-50 box-border"
                      />
                      
                      {addressVerificationError && (
                        <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-100">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p>{addressVerificationError}</p>
                        </div>
                      )}
        
                      <button
                        onClick={handleVerifyManualAddress}
                        disabled={!manualAddress.trim() || isVerifyingAddress}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
                      >
                        {isVerifyingAddress ? 'Checking address...' : 'Save Location'}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                      
                      <div className="flex items-center gap-2 text-emerald-800">
                        <Check className="h-5 w-5 bg-emerald-100 rounded-full p-1 text-emerald-600" />
                        <h3 className="font-black">Address matched</h3>
                      </div>
                      
                      <div className="text-xs font-bold text-emerald-900/70 bg-emerald-100/50 p-3 rounded-xl">
                        ? Mappls verified location
                      </div>
                      
                      <div className="text-sm font-bold text-gray-900 leading-relaxed bg-white p-4 rounded-xl border border-emerald-100">
                        {matchedAddressResult.formattedAddress}
                      </div>
        
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setMatchedAddressResult(null);
                            setAddressVerificationError(null);
                          }}
                          className="flex-1 rounded-xl bg-white border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                        >
                          Change Address
                        </button>
                        <button
                          onClick={handleConfirmManualAddress}
                          className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-700 shadow-sm transition"
                        >
                          Use This Location
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}`;
code = code.replace(modalRegex, newModalUI);

// Remove the hardcoded Bandipora city fallback
code = code.replace(/if \(!cleanCity \|\| cleanCity === 'Current Location' \|\| cleanCity === 'GPS'\) cleanCity = 'Bandipora';/, '// Removed Bandipora fallback per user request');
code = code.replace(/if \(!cleanState \|\| cleanState === 'GPS' \|\| cleanState === 'Current Location'\) cleanState = 'Jammu & Kashmir';/, '// Removed J&K fallback');

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
