import React from 'react';
import type { Metadata } from 'next';
import { getApiBaseUrl, getImageUrl } from '@foodhub/config';

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const baseUrl = 'https://zaykafood.online';
  const canonicalUrl = `${baseUrl}/restaurant/${slug}`;
  const apiBase = getApiBaseUrl();

  let restaurantName = 'Restaurant Menu';
  let description =
    'Order delicious food online with Zayka Food. Explore menus, view prices and order food online for delivery across Kashmir.';
  let bannerUrl = `${baseUrl}/icon.png`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${apiBase}/restaurants/${slug}`, {
      signal: controller.signal,
      next: { revalidate: 60 },
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.name) {
        restaurantName = data.name;
        description = `Order delicious food from ${data.name} on Zayka Food. Explore the menu, view prices and order food online for delivery.`;
        if (data.bannerUrl || data.logoUrl) {
          bannerUrl = getImageUrl(data.bannerUrl || data.logoUrl);
        }
      }
    }
  } catch {
    // Graceful fallback if backend is slow/offline
  }

  const title = `${restaurantName} – Order Food Online | Zayka Food`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Zayka Food',
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: bannerUrl,
          alt: restaurantName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [bannerUrl],
    },
  };
}

export default async function RestaurantLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }> | { slug: string };
  children: React.ReactNode;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const baseUrl = 'https://zaykafood.online';
  const canonicalUrl = `${baseUrl}/restaurant/${slug}`;
  const apiBase = getApiBaseUrl();

  let restaurantData = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${apiBase}/restaurants/${slug}`, {
      signal: controller.signal,
      next: { revalidate: 60 },
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      restaurantData = await res.json().catch(() => null);
    }
  } catch {
    // Graceful fallback
  }

  const restaurantName = restaurantData?.name || 'Restaurant';
  const cuisines = Array.isArray(restaurantData?.cuisines)
    ? restaurantData.cuisines
    : typeof restaurantData?.cuisines === 'string'
      ? restaurantData.cuisines.split(',').map((c: string) => c.trim())
      : ['Multi-Cuisine'];
  const address = restaurantData?.addressLine || restaurantData?.address || 'Kashmir, India';
  const banner =
    restaurantData?.bannerUrl || restaurantData?.logoUrl
      ? getImageUrl(restaurantData.bannerUrl || restaurantData.logoUrl)
      : `${baseUrl}/icon.png`;

  const restaurantSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurantName,
    image: banner,
    url: canonicalUrl,
    servesCuisine: cuisines,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressRegion: 'Jammu & Kashmir',
      addressCountry: 'IN',
    },
  };

  if (restaurantData?.phone) {
    restaurantSchema.telephone = restaurantData.phone;
  }

  if (restaurantData?.priceForTwo) {
    restaurantSchema.priceRange = `₹₹ (₹${restaurantData.priceForTwo} for two)`;
  }

  if (
    restaurantData?.avgRating &&
    Number(restaurantData.avgRating) > 0 &&
    restaurantData?.ratingCount
  ) {
    restaurantSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(restaurantData.avgRating).toFixed(1),
      reviewCount: Number(restaurantData.ratingCount),
      bestRating: '5',
      worstRating: '1',
    };
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Restaurants',
        item: `${baseUrl}/restaurants`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: restaurantName,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
