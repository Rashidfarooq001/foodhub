import { Metadata } from 'next';
import { getApiBaseUrl } from '@foodhub/config';
import CategoryClient from './client';

const API_BASE = getApiBaseUrl();

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return { title: 'Category Not Found | ZaykaFood' };
    }
    const data = await res.json();
    return {
      title: `${data.name} | ZaykaFood`,
      description: `Explore the best ${data.name} on ZaykaFood. Fast delivery in Kashmir.`,
    };
  } catch (error) {
    return { title: 'ZaykaFood Categories' };
  }
}

export default async function CategoryPage() {
  return <CategoryClient />;
}
