const fs = require('fs');

let code = fs.readFileSync('apps/customer-web/src/app/addresses/page.tsx', 'utf8');

// 1. Remove DynamicAddressPickerMap import and usage
code = code.replace(/const DynamicAddressPickerMap = dynamic\([\s\S]*?\{ ssr: false \},\s*\);\r?\n/, '');
code = code.replace(/import dynamic from 'next\/dynamic';\r?\n/, '');

// 2. Add verification state
code = code.replace(/const \[isSubmitting, setIsSubmitting\] = useState\(false\);\r?\n/, `const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [matchedAddress, setMatchedAddress] = useState<any>(null);
  
  const handleVerifyAddress = async () => {
    if (!addressLine1.trim()) return;
    setIsVerifying(true);
    setVerificationError('');
    setMatchedAddress(null);
    try {
      const res = await fetch(\`\${API_BASE}/geolocation/forward-geocode\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressLine1.trim() }),
      });
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        setMatchedAddress({
          latitude: data.latitude,
          longitude: data.longitude,
          formattedAddress: data.formattedAddress || addressLine1.trim(),
        });
        setLatitude(data.latitude);
        setLongitude(data.longitude);
      } else {
        setVerificationError("Couldn't find this address. Please enter a more specific address.");
      }
    } catch {
      setVerificationError("Unable to verify this address right now. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };
`);

// 3. Replace the Modal UI
const modalRegex = /\{\/\* Interactive Leaflet Location Picker \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const newModalUI = `{/* MAPPLS VERIFICATION & MANUAL ENTRY */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Address Type</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={\`flex-1 rounded-2xl py-2.5 text-xs font-bold border transition \${
                        label === l ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xs' : 'border-gray-200 text-gray-600'
                      }\`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Delivery Address *</label>
                <textarea
                  required
                  rows={4}
                  value={addressLine1}
                  onChange={(e) => {
                    setAddressLine1(e.target.value);
                    setMatchedAddress(null);
                  }}
                  placeholder="House 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir 193201"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none resize-none"
                />
              </div>
              
              {verificationError && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-100">
                  <p>{verificationError}</p>
                </div>
              )}

              {!matchedAddress ? (
                <button
                  type="button"
                  onClick={handleVerifyAddress}
                  disabled={!addressLine1.trim() || isVerifying}
                  className="w-full rounded-2xl bg-gray-900 py-3.5 text-sm font-black text-white hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {isVerifying ? 'Checking address...' : 'Verify Address'}
                </button>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-black">Address matched</h4>
                  </div>
                  <p className="text-xs font-bold text-emerald-900/70">? Mappls verified location</p>
                  <p className="text-sm font-bold text-gray-900 bg-white p-3 rounded-lg border border-emerald-100">
                    {matchedAddress.formattedAddress}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || !matchedAddress}
                className="flex-1 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}`;

code = code.replace(modalRegex, newModalUI);

fs.writeFileSync('apps/customer-web/src/app/addresses/page.tsx', code);
console.log("Updated addresses page");
