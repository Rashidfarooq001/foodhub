import os

filepath = 'apps/backend/src/modules/restaurants/restaurants.module.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { OrdersModule } from '../orders/orders.module';",
    "import { OrdersModule } from '../orders/orders.module';\nimport { GeolocationModule } from '../geolocation/geolocation.module';"
)
content = content.replace(
    "imports: [DatabaseModule, OrdersModule],",
    "imports: [DatabaseModule, OrdersModule, GeolocationModule],"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added GeolocationModule to RestaurantsModule")
