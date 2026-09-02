import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\backend\src\modules\drivers\delivery-jobs.controller.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Using regex to remove getCurrentJob
start = content.find("  @Get('current')")
end = content.find("  @Get('stats')", start)

if start != -1 and end != -1:
    content = content[:start] + content[end:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
