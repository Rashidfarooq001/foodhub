const fs = require('fs');
let content = fs.readFileSync('apps/hotel-dashboard/src/app/orders/page.tsx', 'utf8');
content = content.replace(
  'const [errorMessage, setErrorMessage] = useState<string | null>(null);',
  'const [errorMessage, setErrorMessage] = useState<string | null>(null);\n  const [fetchError, setFetchError] = useState<string | null>(null);'
);
content = content.replace(
  'const fetchOrders = async () => {\\n    try {',
  'const fetchOrders = async (silent = false) => {\\n    try {\\n      if (!silent) {\\n        setIsLoading(true);\\n        setFetchError(null);\\n      }'
);
content = content.replace(
  } catch (err) {
      console.error('Error fetching orders:', err);
        setErrorMessage('Failed to fetch orders from server.');
    } finally {
      setIsLoading(false);,
  } else {
        if (res.status === 401 || res.status === 403) {
          setFetchError('Access denied. Please login again.');
        } else {
          setFetchError(\Failed to load orders from server. (HTTP \)\);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setFetchError('Network error: Unable to load orders. Please check your connection.');
    } finally {
      if (!silent) setIsLoading(false);
);
content = content.replace(
  '{/* Mobile Card Grid (< 768px) */}',
  {fetchError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 py-8 px-4 text-center space-y-3 mb-6">
          <p className="text-sm font-bold text-red-600">Unable to load orders</p>
          <p className="text-xs text-red-500">{fetchError}</p>
          <button onClick={() => fetchOrders()} className="px-4 py-2 mt-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50">Retry</button>
        </div>
      ) : (
        <>
          {/* Mobile Card Grid (< 768px) */}
);
content = content.replace(
  '          </table>\\n        </div>\\n      </div>\\n\\n      {/* MODALS */}',
  '          </table>\\n        </div>\\n      </div>\\n      </>\\n      )}\\n\\n      {/* MODALS */}'
);
fs.writeFileSync('apps/hotel-dashboard/src/app/orders/page.tsx', content);
