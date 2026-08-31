import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@foodhub/config';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  if (!lat || !lng) return NextResponse.json({ formattedAddress: 'Unknown location' });

  const backendUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${backendUrl}/geolocation/reverse?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ formattedAddress: 'Unknown location' });
  }
}
