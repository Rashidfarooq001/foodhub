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
        console.error("Order Service Route Error:", err.message);
        distanceKm = 999; 
      }
    }"""

content = re.sub(
    r"\/\/\s*Calculate real Haversine distance in km server-side[\s\S]*?const dist = Math\.round\(R \* c \* 10\) \/ 10;\s*\}",
    replacement,
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced Haversine block in orders.service.ts")
