import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || '';
  if (!query.trim()) return NextResponse.json({ suggestions: [] });

  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://foodhub-backend-enq2.onrender.com/api/v1';
  try {
    const res = await fetch(`${backendUrl}/geolocation/autosuggest?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
