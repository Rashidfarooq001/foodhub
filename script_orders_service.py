import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\backend\src\modules\orders\orders.service.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("          assignedFoodHubDriverId: null,\n", "")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
