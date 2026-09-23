import sys
with open('apps/hotel-dashboard/src/app/orders/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('onClick={fetchOrders}', 'onClick={() => fetchOrders()}')

with open('apps/hotel-dashboard/src/app/orders/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
