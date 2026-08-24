import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  if (!lat || !lng) return NextResponse.json({ formattedAddress: 'Unknown location' });

  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://foodhub-backend-enq2.onrender.com/api/v1';
  try {
    const res = await fetch(`${backendUrl}/geolocation/reverse?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ formattedAddress: 'Unknown location' });
  }
}
