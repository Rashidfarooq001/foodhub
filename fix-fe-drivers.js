const fs = require('fs');
const path = require('path');

const fePath = path.join('apps', 'admin-dashboard', 'src', 'app', 'delivery-partners', 'page.tsx');
let code = fs.readFileSync(fePath, 'utf8');

// 1. Add page and total state
code = code.replace(
/const \[statusFilter, setStatusFilter\] = useState<string>\('ALL'\);/,
`const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);`
);

// 2. Modify fetchDrivers
code = code.replace(
/const fetchDrivers = async \(\) => \{[\s\S]*?setIsLoading\(false\);\s*\}\s*\};/g,
`const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const q = encodeURIComponent(search);
      const res = await adminFetch(\`/drivers?page=\${page}&limit=20&search=\${q}&status=\${statusFilter}\`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };`
);

// 3. Modify useEffect to listen to page, search, statusFilter
code = code.replace(
/useEffect\(\(\) => \{\s*fetchDrivers\(\);[\s\S]*?\}\, \[\]\);/g,
`// Fetch data effect
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchDrivers();
    }, 300);
    return () => clearTimeout(delay);
  }, [page, statusFilter, search]);

  // Socket effect
  useEffect(() => {
    try {
      const apiBase = getApiBaseUrl();
      const socketUrl = apiBase.replace('/api/v1', '');
      const socket = io(\`\${socketUrl}/orders\`, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket.emit('joinAdmin', { token: getAdminAccessToken() ?? '' });
      });

      socket.on(
        'driver.status_changed',
        (payload: { driverId: string; status?: string; isApproved?: boolean }) => {
          if (payload?.driverId) {
            setDrivers((prev) =>
              prev.map((d) =>
                d.id === payload.driverId
                  ? {
                      ...d,
                      status: payload.status ?? d.status,
                      isApproved: payload.isApproved ?? d.isApproved,
                    }
                  : d,
              ),
            );
          }
        },
      );

      return () => {
        socket.disconnect();
      };
    } catch {
      // ignore
    }
  }, []);`
);

// 4. Remove local filtering logic and use drivers directly
code = code.replace(
/const filtered = drivers\.filter\(\(d\) => \{[\s\S]*?return matchesStatus && matchesSearch;\s*\}\);/g,
`const filtered = drivers; // Server-side filtering now`
);

// 5. Update counts on the tabs (we can't know counts for inactive tabs locally anymore, so we omit them)
code = code.replace(
/let count = 0;\s*if \(st === 'ALL'\)[\s\S]*?return \(/g,
`return (`
);
code = code.replace(
/\{st\} \(\{count\}\)/g,
`{st}`
);

// 6. Add pagination UI at bottom of table
code = code.replace(
/<\/div>\s*<\/>\s*\)\}\s*<\/div>/g,
`</div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-gray-500">Page {page} of {totalPages}</span>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>`
);

// Fix the array map where it uses setPage inside onClick instead of page 1 reset
code = code.replace(
/onChange=\{\(e\) => setSearch\(e\.target\.value\)\}/g,
`onChange={(e) => { setSearch(e.target.value); setPage(1); }}`
);
code = code.replace(
/onClick=\{\(\) => setStatusFilter\(st\)\}/g,
`onClick={() => { setStatusFilter(st); setPage(1); }}`
);


fs.writeFileSync(fePath, code);
console.log('Fixed delivery-partners page.tsx');
