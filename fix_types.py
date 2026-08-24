import os

files = [
    'apps/backend/src/modules/orders/orders.service.ts',
    'apps/backend/src/modules/tax/order-quote.service.ts',
    'apps/backend/src/modules/orders/dto/customer-order-quote.dto.ts',
    'apps/backend/src/modules/geolocation/distance.service.ts',
    'packages/api-client/src/tax.ts',
    'packages/api-client/src/tax.d.ts',
]

replacements = [
    ("'HAVERSINE' | 'ROAD_ROUTING'", "'MAPPLS_ROAD_ROUTING'"),
    ("distanceType: 'ROAD_ROUTING'", "distanceType: 'MAPPLS_ROAD_ROUTING'"),
    ('Google Routes / Distance Matrix', 'Mappls Routing / Distance Matrix'),
    ('Order Service Route Error', 'Mappls Route Error (unserviceable)'),
    ('real Haversine distance', 'Mappls road distance'),
    ('calculate real Haversine distance', 'calculate Mappls road distance'),
    ("'ROAD_ROUTING'", "'MAPPLS_ROAD_ROUTING'"),
    ("ROAD_ROUTING;", "MAPPLS_ROAD_ROUTING;"),
    ("ROAD_ROUTING'", "MAPPLS_ROAD_ROUTING'"),
]

for fpath in files:
    if not os.path.exists(fpath):
        print(f'SKIP {fpath}')
        continue
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        orig = content
        for old, new in replacements:
            content = content.replace(old, new)
        if content != orig:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Updated {fpath}')
        else:
            print(f'No change {fpath}')
    except Exception as e:
        print(f'ERROR {fpath}: {e}')
