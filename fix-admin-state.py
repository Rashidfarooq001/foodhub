import sys
with open('apps/admin-dashboard/src/app/orders/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_state = '''  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [refreshTrigger, setRefreshTrigger] = useState(0);'''

new_state = '''  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const [refreshTrigger, setRefreshTrigger] = useState(0);'''

content = content.replace(old_state, new_state)

with open('apps/admin-dashboard/src/app/orders/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
