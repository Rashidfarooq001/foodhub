const fs = require('fs');
const path = require('path');

const fePath = path.join('apps', 'hotel-dashboard', 'src', 'app', 'orders', 'page.tsx');
let code = fs.readFileSync(fePath, 'utf8');

if (!code.includes('countsByStatus')) {
  // Add page, total, and counts state
  code = code.replace(
    /const \[filter, setFilter\] = useState<'NEW_ORDERS' \| 'ACCEPTED' \| 'PREPARING' \| 'READY' \| 'COMPLETED' \| 'CANCELLED'>\('NEW_ORDERS'\);/,
    `const [filter, setFilter] = useState<'NEW_ORDERS' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'>('NEW_ORDERS');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [countsByStatus, setCountsByStatus] = useState<Record<string, number>>({});`
  );

  // Update fetchOrders
  code = code.replace(
    /const fetchOrders = async \(\) => \{[\s\S]*?setIsLoading\(false\);\s*\}\s*\};/g,
    `const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const statusList = RESTAURANT_ORDER_FILTERS[filter].join(',');
      const res = await fetch(\`\${API_BASE}/orders?page=\${page}&limit=20&status=\${statusList}\`, {
        headers: accessToken ? { Authorization: \`Bearer \${accessToken}\` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || (Array.isArray(data) ? data : []));
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
      
      // Fetch counts independently
      const countsRes = await fetch(\`\${API_BASE}/orders/counts\`, {
        headers: accessToken ? { Authorization: \`Bearer \${accessToken}\` } : {},
      });
      if (countsRes.ok) {
        const counts = await countsRes.json();
        setCountsByStatus(counts || {});
      }
    } catch {
      showToastError(500);
    } finally {
      setIsLoading(false);
    }
  };`
  );

  // Update useEffect dependencies
  code = code.replace(
    /useEffect\(\(\) => \{\s*if \(!accessToken\) return;[\s\S]*?fetchOrders\(\);\s*\}\, \[accessToken\]\);/g,
    `useEffect(() => {
    if (!accessToken) return;
    fetchOrders();
  }, [accessToken, filter, page]);`
  );

  // Remove local filter logic
  code = code.replace(
    /const getFilteredOrders = \(\) => \{[\s\S]*?return matchesStatus && matchesSearch;\s*\}\);\s*\};\s*const filteredOrders = getFilteredOrders\(\);/g,
    `const filteredOrders = orders.filter(o => {
      const matchesSearch = !search || o.id.includes(search) || o.customerName?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });`
  );

  // Fix counts logic on tabs
  // Currently it does: `${getFilteredCount(RESTAURANT_ORDER_FILTERS.NEW_ORDERS)}`
  // We'll replace `getFilteredCount` calls with our map
  code = code.replace(
    /const getFilteredCount = \(statuses: string\[\]\) => \{[\s\S]*?\}\);\s*\};/g,
    `const getFilteredCount = (statuses: string[]) => {
      return statuses.reduce((sum, st) => sum + (countsByStatus[st] || 0), 0);
    };`
  );
  
  // Pagination UI
  code = code.replace(
    /<\/div>\s*<\/div>\s*\{selectedOrder && \(/g,
    `</div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 pb-2 border-t border-gray-100">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 disabled:opacity-50">Previous</button>
              <span className="text-xs font-medium text-gray-500">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      {selectedOrder && (`
  );

  code = code.replace(/onClick=\{\(\) => setFilter\('NEW_ORDERS'\)\}/g, `onClick={() => { setFilter('NEW_ORDERS'); setPage(1); }}`);
  code = code.replace(/onClick=\{\(\) => setFilter\('ACCEPTED'\)\}/g, `onClick={() => { setFilter('ACCEPTED'); setPage(1); }}`);
  code = code.replace(/onClick=\{\(\) => setFilter\('PREPARING'\)\}/g, `onClick={() => { setFilter('PREPARING'); setPage(1); }}`);
  code = code.replace(/onClick=\{\(\) => setFilter\('READY'\)\}/g, `onClick={() => { setFilter('READY'); setPage(1); }}`);
  code = code.replace(/onClick=\{\(\) => setFilter\('COMPLETED'\)\}/g, `onClick={() => { setFilter('COMPLETED'); setPage(1); }}`);
  code = code.replace(/onClick=\{\(\) => setFilter\('CANCELLED'\)\}/g, `onClick={() => { setFilter('CANCELLED'); setPage(1); }}`);


  fs.writeFileSync(fePath, code);
  console.log('Fixed hotel dashboard orders pagination');
}
