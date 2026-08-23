import os, re

filepath = 'apps/backend/src/modules/restaurants/restaurants.service.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "GeolocationService" not in content:
    content = content.replace("import { PrismaService } from '../database/prisma.service';", "import { PrismaService } from '../database/prisma.service';\nimport { GeolocationService } from '../geolocation/geolocation.service';")

# Add to constructor
content = re.sub(
    r"(constructor\(\s*private readonly prisma: PrismaService,\s*@Optional\(\) private readonly gateway\?: OrdersGateway,)",
    r"\1\n    private readonly geolocationService: GeolocationService,",
    content
)

# Update findAllRestaurants
new_method = """async findAllRestaurants(adminView = false, userLat?: number, userLng?: number) {
    const whereCondition: any = adminView
      ? { deletedAt: null }
      : { status: RestaurantStatus.APPROVED, isOpen: true, deletedAt: null };

    const restaurants = await this.prisma.restaurant.findMany({
      where: whereCondition,
      include: {
        categories: {
          include: {
            foodItems: {
              where: { deletedAt: null },
            },
          },
        },
        documents: true,
        galleries: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    let distances = new Map<string, number>();

    if (userLat !== undefined && userLng !== undefined) {
      const origins = [[userLat, userLng]] as [number, number][];
      const destinations = restaurants.map(r => [r.latitude || 0, r.longitude || 0] as [number, number]);
      try {
        const responseData = await this.geolocationService.computeRouteMatrix(origins, destinations);
        restaurants.forEach((rest, index) => {
          const routeData = responseData.find((r: any) => r.originIndex === 0 && r.destinationIndex === index);
          if (routeData && (routeData.condition === "ROUTE_EXISTS" || routeData.distanceMeters !== undefined)) {
             distances.set(rest.id, Math.round((routeData.distanceMeters / 1000) * 100) / 100);
          }
        });
      } catch (err: any) {
        // Fallback or ignore if Google Routes fails
      }
    }

    return serializePrisma(restaurants.map((restaurant) => {
      let distanceKm: number | null = distances.get(restaurant.id) ?? null;
      return {
        ...restaurant,
        distanceKm,
        avgRating: restaurant.avgRating ? Number(restaurant.avgRating) : 0,
        commissionRate: restaurant.commissionRate ? Number(restaurant.commissionRate) : 0,
      };
    }));
  }"""

# Replace existing findAllRestaurants
content = re.sub(
    r"async findAllRestaurants\(adminView = false, userLat\?: number, userLng\?: number\) \{[\s\S]*?return serializePrisma\(restaurants\.map\(\(restaurant\) => \{[\s\S]*?\}\)\);\n  \}",
    new_method,
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated restaurants.service.ts")
