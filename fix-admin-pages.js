const fs = require('fs');
const path = require('path');

function fixAdminPage(appPath, itemName, apiEndpoint, extraFilterLogic = '') {
  let code = fs.readFileSync(appPath, 'utf8');

  // Add page and total state
  code = code.replace(
    /const \[search, setSearch\] = useState\(''\);[\s\S]*?const \[statusFilter, setStatusFilter\] = useState<string>\('ALL'\);/,
    `const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);`
  );

  // Replace fetch function
  const fetchFuncName = `fetch${itemName}`;
  const fetchRegex = new RegExp(`const ${fetchFuncName} = async \\(\\)[\\s\\S]*?setIsLoading\\(false\\);\\s*\\}\\s*\\};`, 'g');
  
  let newFetch = `const ${fetchFuncName} = async () => {
    setIsLoading(true);
    try {
      const q = encodeURIComponent(search);
      const res = await adminFetch(\`${apiEndpoint}?page=\${page}&limit=20&search=\${q}&status=\${statusFilter}${extraFilterLogic}\`);
      if (res.ok) {
        const data = await res.json();
        set${itemName}(data.${itemName.toLowerCase()} || data.restaurants || data.customers || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };`;
  code = code.replace(fetchRegex, newFetch);

  // UseEffect
  code = code.replace(
    new RegExp(`useEffect\\(\\(\\) => \\{\\s*${fetchFuncName}\\(\\);[\\s\\S]*?\\}\\, \\[\\]\\);`, 'g'),
    `useEffect(() => {
    const delay = setTimeout(() => {
      ${fetchFuncName}();
    }, 300);
    return () => clearTimeout(delay);
  }, [page, statusFilter, search]);`
  );

  // Remove local filter
  const filterRegex = new RegExp(`const filtered = ${itemName.toLowerCase()}\\.filter\\(\\(.*?\\) => \\{[\\s\\S]*?return .*?;\\s*\\}\\);`, 'g');
  code = code.replace(filterRegex, `const filtered = ${itemName.toLowerCase()};`);
  
  // Fix counts
  code = code.replace(/let count = 0;\s*if \(st === 'ALL'\)[\s\S]*?return \(/g, `return (`);
  code = code.replace(/\{st\} \(\{count\}\)/g, `{st}`);

  // Pagination UI
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

  // Search/filter triggers
  code = code.replace(/onChange=\{\(e\) => setSearch\(e\.target\.value\)\}/g, `onChange={(e) => { setSearch(e.target.value); setPage(1); }}`);
  code = code.replace(/onClick=\{\(\) => setStatusFilter\(st\)\}/g, `onClick={() => { setStatusFilter(st); setPage(1); }}`);

  fs.writeFileSync(appPath, code);
}

fixAdminPage(path.join('apps', 'admin-dashboard', 'src', 'app', 'restaurants', 'page.tsx'), 'Restaurants', '/restaurants', '&admin=true');
fixAdminPage(path.join('apps', 'admin-dashboard', 'src', 'app', 'customers', 'page.tsx'), 'Customers', '/users/customers');

console.log('Fixed admin pages');
