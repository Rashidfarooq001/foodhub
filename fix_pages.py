import os
files = [
    'apps/customer-web/src/app/delivery-policy/page.tsx',
    'apps/customer-web/src/app/terms-and-conditions/page.tsx',
    'apps/customer-web/src/app/privacy-policy/page.tsx',
]
replacements = [
    ('Haversine', 'MapmyIndia road'),
    ('haversine', 'MapmyIndia road'),
    ('Google Maps', 'Mappls (MapmyIndia)'),
    ('Google Places', 'Mappls Search'),
    ('Google Geocoding', 'Mappls Geocoding'),
]
for fpath in files:
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != orig:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {fpath}')
