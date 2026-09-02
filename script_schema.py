import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\backend\prisma\schema.prisma'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('  assignedFoodHubDriverId    String?       @map("assigned_foodhub_driver_id") @db.Uuid\n', "")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
