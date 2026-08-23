import os, re

filepath = 'apps/backend/src/modules/orders/orders.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """    // Calculate strict route distance using Google Maps
    if (latitudeNum && longitudeNum && restLat && restLng) {
      try {
        const route = await this.geolocationService.calculateDistanceAndEta(restLat, restLng, latitudeNum, longitudeNum);
        distanceKm = route.distanceKm;
      } catch (err: any) {
        // Log and fallback to error or 999 to prevent free delivery on unroutable terrain
        console.error("Order Service Route Error:", err.message);
        distanceKm = 999; 
      }
    }"""

content = re.sub(
    r"\/\/\s*Calculate real Haversine distance in km server-side[\s\S]*?distanceKm\s*=\s*Number\(\(R \* c\)\.toFixed\(2\)\);\n\s*\}",
    replacement,
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced Haversine block in orders.service.ts")
