import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\backend\src\modules\drivers\drivers.service.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("              assignedFoodHubDriverId: null,\n", "")

content = content.replace('''      // Also nullify from Orders where completed
      await tx.order.updateMany({
        where: { assignedFoodHubDriverId: driverId },
        data: { assignedFoodHubDriverId: null },
      });\n\n''', "")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
