import os, re

filepath = 'apps/backend/src/modules/orders/orders.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r"\s*\/\/\s*Calculate strict route distance using Google Maps[\s\S]*?distanceKm\s*=\s*999;\s*\}\s*\}",
    "",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed unused distance assignment in orders.service.ts")
