import os

filepath = 'apps/backend/src/modules/geolocation/geolocation.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'private async computeRouteMatrix(origins: [number, number][], destinations: [number, number][]) {',
    'public async computeRouteMatrix(origins: [number, number][], destinations: [number, number][]) {'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Made computeRouteMatrix public")
