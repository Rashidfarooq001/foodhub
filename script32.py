import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\delivery-dashboard\src\app\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "fetch(/delivery/active-jobs?_t=, { headers, cache: 'no-store' })",
    "fetch(${API_BASE}/delivery/active-jobs?_t=, { headers, cache: 'no-store' })"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax")
