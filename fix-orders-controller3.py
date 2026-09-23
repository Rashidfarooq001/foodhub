import sys
import re
with open('apps/backend/src/modules/orders/orders.controller.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'(@Query\(\'status\'\) status\?: string,)',
    r'\1\n    @Query(\'search\') search?: string,',
    content
)

with open('apps/backend/src/modules/orders/orders.controller.ts', 'w', encoding='utf-8') as f:
    f.write(content)
