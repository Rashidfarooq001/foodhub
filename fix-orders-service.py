import sys
with open('apps/backend/src/modules/orders/orders.service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'async getAllOrders(status?: any, page = 1, limit = 20) {\\n    const res = await this.repo.findAll(status, page, limit);',
    'async getAllOrders(status?: any, search?: string, page = 1, limit = 20) {\\n    const res = await this.repo.findAll(status, search, page, limit);'
)

with open('apps/backend/src/modules/orders/orders.service.ts', 'w', encoding='utf-8') as f:
    f.write(content)
