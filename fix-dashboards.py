import sys

# 1. Fix Hotel Dashboard
with open('apps/hotel-dashboard/src/app/orders/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const [errorMessage, setErrorMessage] = useState<string | null>(null);',
    'const [errorMessage, setErrorMessage] = useState<string | null>(null);\n  const [fetchError, setFetchError] = useState<string | null>(null);'
)

content = content.replace(
    'const fetchOrders = async () => {\n    try {\n      const queryParams = new URLSearchParams();',
    'const fetchOrders = async (silent = false) => {\n    try {\n      if (!silent) {\n        setIsLoading(true);\n        setFetchError(null);\n      }\n      const queryParams = new URLSearchParams();'
)

old_catch = '''        setOrders(formatted);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
        setErrorMessage('Failed to fetch orders from server.');
    } finally {
      setIsLoading(false);'''

new_catch = '''        setOrders(formatted);
      } else {
        if (res.status === 401 || res.status === 403) {
          setFetchError('Access denied. Please login again.');
        } else {
          setFetchError(`Failed to load orders from server. (HTTP ${res.status})`);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setFetchError('Network error: Unable to load orders. Please check your connection.');
    } finally {
      if (!silent) setIsLoading(false);'''

content = content.replace(old_catch, new_catch)

old_render = '{/* Mobile Card Grid (< 768px) */}'
new_render = '''{fetchError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 py-8 px-4 text-center space-y-3 mb-6">
          <p className="text-sm font-bold text-red-600">Unable to load orders</p>
          <p className="text-xs text-red-500">{fetchError}</p>
          <button onClick={() => fetchOrders()} className="px-4 py-2 mt-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50">Retry</button>
        </div>
      ) : (
        <>
          {/* Mobile Card Grid (< 768px) */}'''

content = content.replace(old_render, new_render)

old_end = '''          </table>
        </div>
      </div>

      {/* MODALS */}'''
new_end = '''          </table>
        </div>
      </div>
      </>
      )}

      {/* MODALS */}'''

content = content.replace(old_end, new_end)

with open('apps/hotel-dashboard/src/app/orders/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


# 2. Fix Delivery Dashboard
with open('apps/delivery-dashboard/src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const [locationError, setLocationError] = useState<string | null>(null);',
    'const [locationError, setLocationError] = useState<string | null>(null);\n  const [fetchError, setFetchError] = useState<string | null>(null);'
)

content = content.replace(
    'const fetchDashboardData = async () => {\n    if (!accessToken) {\n      setIsLoading(false);\n      return;\n    }',
    'const fetchDashboardData = async () => {\n    if (!accessToken) {\n      setIsLoading(false);\n      return;\n    }\n    setFetchError(null);'
)

old_active = '''          const fetchActiveJobs = fetch(`${API_BASE}/delivery/active-jobs?_t=${Date.now()}`, { headers, cache: 'no-store' })
            .then(async r => {
              handle401(r);
              if (r.ok) {
                const text = await r.text();
                try {
                  const parsed = text ? JSON.parse(text) : null;
                  const jobsPayload = parsed?.data || parsed || [];
                  setActiveDeliveries(Array.isArray(jobsPayload) ? jobsPayload : []);
                } catch (e: any) {
                  setLocationError(`Parse Error: ${e.message}`);
                }
              } else {
                setLocationError(`API Error: ${r.status} on active-jobs`);
              }
            }).catch((e: any) => {
              setLocationError(`Network Error: ${e.message}`);
            });'''

new_active = '''          const fetchActiveJobs = fetch(`${API_BASE}/delivery/active-jobs?_t=${Date.now()}`, { headers, cache: 'no-store' })
            .then(async r => {
              handle401(r);
              if (r.ok) {
                const text = await r.text();
                try {
                  const parsed = text ? JSON.parse(text) : null;
                  const jobsPayload = parsed?.data || parsed || [];
                  setActiveDeliveries(Array.isArray(jobsPayload) ? jobsPayload : []);
                } catch (e: any) {
                  setFetchError(`Parse Error on active jobs: ${e.message}`);
                }
              } else {
                setFetchError(`API Error: ${r.status} on active-jobs`);
              }
            }).catch((e: any) => {
              setFetchError(`Network Error loading active jobs: ${e.message}`);
            });'''
content = content.replace(old_active, new_active)

old_avail = '''          const fetchAvailableJobs = fetch(`${API_BASE}/delivery/jobs/available?_t=${Date.now()}`, { headers, cache: 'no-store' })
            .then(async r => {
              handle401(r);
              if (r.ok) {
                const text = await r.text();
                try {
                  const parsed = text ? JSON.parse(text) : null;
                  const jobsPayload = parsed?.data || parsed || [];
                  setAvailableJobs(Array.isArray(jobsPayload) ? jobsPayload : []);
                } catch (e: any) {
                  console.error("Parse Error on available jobs:", e);
                }
              }
            }).catch(console.error);'''

new_avail = '''          const fetchAvailableJobs = fetch(`${API_BASE}/delivery/jobs/available?_t=${Date.now()}`, { headers, cache: 'no-store' })
            .then(async r => {
              handle401(r);
              if (r.ok) {
                const text = await r.text();
                try {
                  const parsed = text ? JSON.parse(text) : null;
                  const jobsPayload = parsed?.data || parsed || [];
                  setAvailableJobs(Array.isArray(jobsPayload) ? jobsPayload : []);
                } catch (e: any) {
                  setFetchError(`Parse Error on available jobs: ${e.message}`);
                }
              } else {
                setFetchError(`API Error: ${r.status} on available-jobs`);
              }
            }).catch((e: any) => {
              setFetchError(`Network Error loading available jobs: ${e.message}`);
            });'''
content = content.replace(old_avail, new_avail)


old_render = '''        {/* Content */}
        <div className="space-y-6">'''
new_render = '''        {/* Content */}
        <div className="space-y-6">
          {fetchError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 py-8 px-4 text-center space-y-3 mb-6">
              <p className="text-sm font-bold text-red-600">Unable to load delivery data</p>
              <p className="text-xs text-red-500">{fetchError}</p>
              <button onClick={() => fetchDashboardData()} className="px-4 py-2 mt-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50">Retry</button>
            </div>
          )}'''
content = content.replace(old_render, new_render)

with open('apps/delivery-dashboard/src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
