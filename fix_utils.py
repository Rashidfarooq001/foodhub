import os

filepath = 'packages/utils/src/geo.ts'
if not os.path.exists(filepath):
    filepath = 'packages/utils/src/geo.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Just empty the calculateHaversineDistance function to avoid breaking imports blindly
content = content.replace(
    'function calculateHaversineDistance(lat1, lon1, lat2, lon2) {',
    'function calculateHaversineDistance(lat1, lon1, lat2, lon2) {\n  throw new Error("Haversine distance is deprecated. Use Google Maps Distance Matrix / Routes API exclusively.");'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Deprecated calculateHaversineDistance in geo utils")
