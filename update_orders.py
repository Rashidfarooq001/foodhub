import os, re

filepath = 'apps/backend/src/modules/orders/orders.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

haversine_block = """    // Calculate real Haversine distance in km server-side
    
    if (latitudeNum && longitudeNum && restLat && restLng) {
      const R = 6371;
      const dLat = ((latitudeNum - restLat) * Math.PI) / 180;
      const dLon = ((longitudeNum - restLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((restLat * Math.PI) / 180) *
          Math.cos((latitudeNum * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = Number((R * c).toFixed(2));
    }"""

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

if "calculateDistanceAndEta" not in content:
    content = content.replace(haversine_block, replacement)
    
    # Check if GeolocationService is in constructor
    if "private readonly geolocationService: GeolocationService" not in content:
        content = re.sub(
            r"(constructor\([\s\S]*?private readonly gateway: OrdersGateway,)",
            r"\1\n    private readonly geolocationService: GeolocationService,",
            content
        )

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated orders.service.ts")
