import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\delivery-dashboard\src\app\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "href={/current-delivery?jobId=}",
    "href={`/current-delivery?jobId=${delivery.id}`}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
