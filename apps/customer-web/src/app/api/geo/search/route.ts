import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@foodhub/config';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || '';
  if (!query.trim()) return NextResponse.json({ suggestions: [] });

  const backendUrl = getApiBaseUrl();
  try {
    const res = await fetch(
      `${backendUrl}/geolocation/autosuggest?query=${encodeURIComponent(query)}`,
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
