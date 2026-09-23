import sys
with open('apps/backend/src/modules/orders/orders.controller.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'return this.ordersService.getAllOrders(status as any, +page, +limit);',
    'return this.ordersService.getAllOrders(status as any, search, +page, +limit);'
)

with open('apps/backend/src/modules/orders/orders.controller.ts', 'w', encoding='utf-8') as f:
    f.write(content)
