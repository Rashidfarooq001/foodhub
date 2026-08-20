import { MetadataRoute } from 'next';
import { getApiBaseUrl } from '@foodhub/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zaykafood.online';
  const apiBase = getApiBaseUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/restaurants`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/partner`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  let dynamicRestaurantRoutes: MetadataRoute.Sitemap = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${apiBase}/restaurants`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json().catch(() => []);
      const restaurants = Array.isArray(data) ? data : data?.restaurants ?? [];

      dynamicRestaurantRoutes = restaurants
        .filter(
          (r: any) =>
            r &&
            r.slug &&
            typeof r.slug === 'string' &&
            r.slug.trim() &&
            (r.status === 'APPROVED' || !r.status) &&
            r.isOpen !== false &&
            !r.deletedAt,
        )
        .map((r: any) => ({
          url: `${baseUrl}/restaurant/${encodeURIComponent(r.slug)}`,
          lastModified: r.updatedAt ? new Date(r.updatedAt) : new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.85,
        }));
    }
  } catch {
    // Graceful fallback if backend is slow/offline
  }

  return [...staticRoutes, ...dynamicRestaurantRoutes];
}
