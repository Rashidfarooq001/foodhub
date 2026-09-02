import re
filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\delivery-dashboard\src\app\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("!!currentDelivery", "activeDeliveries.length > 0")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
