import os, re

path = 'apps/backend/src/modules/restaurants/restaurants.service.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the old Google-style routeData block that was accidentally left behind
old_block = '''          const responseData = await this.geolocationService.computeDistanceMatrix([userLat, userLng], destinations);
          restaurants.forEach((rest, index) => {
            const routeData = responseData.find((r: any) => r.originIndex === 0 && r.destinationIndex === index);
            if (routeData && (routeData.condition === "ROUTE_EXISTS" || routeData.distanceMeters !== undefined)) {
               distances.set(rest.id, Math.round((routeData.distanceMeters / 1000) * 100) / 100);
            }
          });'''

new_block = '''          const matrixResults = await this.geolocationService.computeDistanceMatrix([userLat, userLng], destinations);
          restaurants.forEach((rest, index) => {
            const result = matrixResults[index];
            if (result && result.distanceKm < 999) {
              distances.set(rest.id, result.distanceKm);
              etas.set(rest.id, result.etaMinutes);
            }
          });'''

if old_block in content:
    content = content.replace(old_block, new_block)
    print('Replaced old block')
else:
    print('Old block not found, searching for partial...')
    # Try finding any remaining routeData.condition reference
    if 'routeData.condition' in content or 'distanceMeters' in content:
        print('Found stale Google references')
        content = re.sub(
            r'const responseData = await.*?computeDistanceMatrix.*?\);[\s\S]*?}\s*\);',
            new_block,
            content
        )
    else:
        print('No stale references found')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
