import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/restaurants',
          '/restaurant',
          '/restaurant/',
          '/categories',
          '/categories/',
          '/search',
          '/partner',
          '/support',
        ],
        disallow: [
          '/cart',
          '/checkout',
          '/orders',
          '/orders/',
          '/profile',
          '/addresses',
          '/settings',
          '/login',
          '/signup',
          '/forgot-password',
          '/driver/register',
          '/restaurant/register',
          '/notifications',
          '/referral',
          '/wishlist',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: 'https://zaykafood.online/sitemap.xml',
    host: 'https://zaykafood.online',
  };
}
