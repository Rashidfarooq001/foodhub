import { Metadata } from 'next';
import { getApiBaseUrl, getImageUrl } from '@foodhub/config';
import RestaurantClient from './client';

const API_BASE = getApiBaseUrl();

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/restaurants/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return { title: 'Restaurant Not Found | ZaykaFood' };
    }
    const data = await res.json();
    return {
      title: `${data.name} | ZaykaFood`,
      description: data.description || `Order from ${data.name} on ZaykaFood. Delivery available now.`,
      openGraph: {
        title: `${data.name} | ZaykaFood`,
        description: data.description || `Order from ${data.name} on ZaykaFood. Delivery available now.`,
        images: data.image ? [{ url: getImageUrl(data.image) }] : [],
      },
    };
  } catch (error) {
    return { title: 'ZaykaFood' };
  }
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  
  // Fetch data for structured data
  let structuredData = null;
  try {
    const res = await fetch(`${API_BASE}/restaurants/${slug}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": data.name,
        "image": data.image ? getImageUrl(data.image) : undefined,
        "description": data.description,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": data.address,
          "addressLocality": "Srinagar",
          "addressRegion": "Kashmir"
        },
        "aggregateRating": data.rating > 0 ? {
          "@type": "AggregateRating",
          "ratingValue": data.rating.toString(),
          "reviewCount": data.reviewCount?.toString() || "1"
        } : undefined
      };
    }
  } catch (err) {}

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <RestaurantClient />
    </>
  );
}
