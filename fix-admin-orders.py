import sys
with open('apps/admin-dashboard/src/app/orders/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_fetch = '''  const fetchOrders = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      let query = '/orders?page=1&limit=200';
      if (statusFilter !== 'ALL') {
        const filterValue = ADMIN_ORDER_FILTERS[statusFilter as keyof typeof ADMIN_ORDER_FILTERS];
        if (Array.isArray(filterValue)) {
          query += &status=;
        } else if (filterValue && filterValue !== 'ALL') {
          query += &status=;
        }
      }
      
      const res = await adminFetch(query);'''

new_fetch = '''  const fetchOrders = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      let query = /orders?page=&limit=20;
      if (statusFilter !== 'ALL') {
        const filterValue = ADMIN_ORDER_FILTERS[statusFilter as keyof typeof ADMIN_ORDER_FILTERS];
        if (Array.isArray(filterValue)) {
          query += &status=;
        } else if (filterValue && filterValue !== 'ALL') {
          query += &status=;
        }
      }
      if (search) {
        query += &search=;
      }
      
      const res = await adminFetch(query);'''
content = content.replace(old_fetch, new_fetch)

old_filter = '''  const filtered = orders.filter((o) => {
    let matchesStatus = false;

    if (statusFilter === 'ALL') {
      matchesStatus = true;
    } else {
      const filterValue = ADMIN_ORDER_FILTERS[statusFilter as keyof typeof ADMIN_ORDER_FILTERS];
      if (Array.isArray(filterValue)) {
        matchesStatus = (filterValue as readonly string[]).includes(o.status);
      } else {
        matchesStatus = filterValue === o.status;
      }
    }

    const ordNum = o.orderNumber || o.id || '';
    const cust = o.customer?.profile?.firstName || o.customerName || '';
    const rest = o.restaurant?.name || '';
    const matchesSearch =
      !search ||
      ordNum.toLowerCase().includes(search.toLowerCase()) ||
      cust.toLowerCase().includes(search.toLowerCase()) ||
      rest.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });'''
new_filter = '''  const filtered = orders;'''
content = content.replace(old_filter, new_filter)

# Also need to add pagination state
old_state = '''  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshTrigger, setRefreshTrigger] = useState(0);'''
new_state = '''  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [page, setPage] = useState(1);'''
content = content.replace(old_state, new_state)

old_dep = '''  useEffect(() => {
    fetchOrders(refreshTrigger > 0); // silent if it's from socket
  }, [statusFilter, refreshTrigger]);'''
new_dep = '''  useEffect(() => {
    fetchOrders(refreshTrigger > 0); // silent if it's from socket
  }, [statusFilter, refreshTrigger, search, page]);'''
content = content.replace(old_dep, new_dep)

with open('apps/admin-dashboard/src/app/orders/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
