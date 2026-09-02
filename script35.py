import sys

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\delivery-dashboard\src\app\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State
content = content.replace(
    "const [currentDelivery, setCurrentDelivery] = useState<any>(null);",
    "const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);"
)

# 2. Fetch Block
old_fetch = '''        const fetchCurrent = fetch(${API_BASE}/delivery/current?_t=, { headers, cache: 'no-store' })
          .then(async r => {
            if (r.ok) {
              const text = await r.text();
              try {
                const parsed = text ? JSON.parse(text) : null;
                // If the backend wraps it in data (e.g. { data: {...} }), extract it
                const jobPayload = parsed?.data || parsed;
                setCurrentDelivery(jobPayload);
              } catch (e) {
                console.error("Failed to parse current delivery:", text);
                setCurrentDelivery(null);
              }
            } else {
              setCurrentDelivery(null);
            }
          }).catch(e => {
            console.error("Network error fetching current delivery:", e);
            setCurrentDelivery(null);
          });'''

new_fetch = '''        const fetchActiveJobs = fetch(${API_BASE}/delivery/active-jobs?_t=, { headers, cache: 'no-store' })
          .then(async r => {
            if (r.ok) {
              const text = await r.text();
              try {
                const parsed = text ? JSON.parse(text) : null;
                const jobsPayload = parsed?.data || parsed || [];
                setActiveDeliveries(Array.isArray(jobsPayload) ? jobsPayload : []);
              } catch (e) {
                console.error("Failed to parse active jobs:", text);
                setActiveDeliveries([]);
              }
            } else {
              setActiveDeliveries([]);
            }
          }).catch(e => {
            console.error("Network error fetching active jobs:", e);
            setActiveDeliveries([]);
          });'''

content = content.replace(old_fetch, new_fetch)
content = content.replace("fetchCurrent", "fetchActiveJobs")

# 3. Disable logic
content = content.replace(
    "disabled={isTogglingDuty || (isOnDuty && !!currentDelivery)}",
    "disabled={isTogglingDuty || (isOnDuty && activeDeliveries.length > 0)}"
)
content = content.replace(
    "isOnDuty && !!currentDelivery\n                ? 'bg-gray-200",
    "isOnDuty && activeDeliveries.length > 0\n                ? 'bg-gray-200"
)

# 4. Rendering Banner
old_banner = '''        {/* ACTIVE DELIVERY IN PROGRESS BANNER (If job active) */}
        {currentDelivery && (
          <div className="rounded-2xl sm:rounded-3xl border-2 border-orange-500 bg-orange-50/50 p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-orange-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-600 animate-ping" />
                <span className="text-xs font-black text-orange-950 uppercase">
                  ACTIVE DELIVERY IN PROGRESS
                </span>
              </div>
              <span className="rounded-xl bg-orange-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase">
                #{currentDelivery.orderNumber || currentDelivery.id?.slice(0, 8)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">
                  Pickup Restaurant
                </span>
                <span className="font-black text-gray-900">
                  {currentDelivery.restaurantName || 'Restaurant Kitchen'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">
                  Customer Area
                </span>
                <span className="font-black text-gray-900">
                  {currentDelivery.customerAddress || 'Customer Destination'}
                </span>
              </div>
            </div>

            <Link
              href="/current-delivery"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 py-3 text-xs font-black text-white shadow-md shadow-orange-500/25 transition min-h-[44px]"
            >
              <Navigation className="h-4 w-4" />
              <span>Open Active Delivery Console &amp; OTP</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}'''

new_banner = '''        {/* ACTIVE DELIVERIES */}
        {activeDeliveries.map((delivery, index) => (
          <div key={delivery.id} className="rounded-2xl sm:rounded-3xl border-2 border-orange-500 bg-orange-50/50 p-4 sm:p-5 shadow-lg space-y-3 mb-4">
            <div className="flex items-center justify-between border-b border-orange-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-600 animate-ping" />
                <span className="text-xs font-black text-orange-950 uppercase">
                  {index === 0 ? "ACTIVE DELIVERY IN PROGRESS" : "ADDITIONAL ACTIVE DELIVERY"}
                </span>
              </div>
              <span className="rounded-xl bg-orange-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase">
                #{delivery.orderNumber || delivery.id?.slice(0, 8)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">
                  Pickup Restaurant
                </span>
                <span className="font-black text-gray-900">
                  {delivery.restaurantName || 'Restaurant Kitchen'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">
                  Customer Area
                </span>
                <span className="font-black text-gray-900">
                  {delivery.customerAddress || 'Customer Destination'}
                </span>
              </div>
            </div>

            <Link
              href={/current-delivery?jobId=}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 py-3 text-xs font-black text-white shadow-md shadow-orange-500/25 transition min-h-[44px]"
            >
              <Navigation className="h-4 w-4" />
              <span>Open Active Delivery Console &amp; OTP</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}'''

content = content.replace(old_banner, new_banner)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
