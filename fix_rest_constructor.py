import os

filepath = 'apps/backend/src/modules/restaurants/restaurants.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "@Optional() private readonly gateway?: OrdersGateway,\n    private readonly geolocationService: GeolocationService,",
    "private readonly geolocationService: GeolocationService,\n    @Optional() private readonly gateway?: OrdersGateway,"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed constructor parameter order in restaurants.service.ts")
