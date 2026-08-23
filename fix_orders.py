import os, re

filepath = 'apps/backend/src/modules/orders/orders.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if "import { GeolocationService }" not in content:
    content = "import { GeolocationService } from '../geolocation/geolocation.service';\n" + content

if "private readonly geolocationService: GeolocationService" not in content:
    content = content.replace("private readonly quoteService: OrderQuoteService,", "private readonly quoteService: OrderQuoteService,\n    private readonly geolocationService: GeolocationService,")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed orders.service.ts imports and constructor")
