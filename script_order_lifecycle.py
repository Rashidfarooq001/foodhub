import re

filepath = r'C:\Users\RASHID FAROOQ\.gemini\antigravity\scratch\foodhub\apps\backend\src\modules\orders\order-lifecycle.service.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove assignedDriverId var definition
content = re.sub(r"      const assignedDriverId =\s*extraData\?\.deliveryJobPayload\?\.create\?\.driverId \|\|\s*extraData\?\.deliveryJobPayload\?\.update\?\.driverId \|\|\s*actor\.driverId;\n+", "", content)

# Remove the line inside the update data
content = re.sub(r"\s*\.\.\.\(targetStatus === OrderStatus\.DRIVER_ASSIGNED && assignedDriverId\s*\?\s*\{\s*assignedFoodHubDriverId:\s*assignedDriverId\s*\}\s*:\s*\{\}\),", "", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
