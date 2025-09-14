import { NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/recs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const kParam = searchParams.get('k');

  if (!latParam || !lngParam) {
    return NextResponse.json({ error: 'Missing lat or lng parameters' }, { status: 400 });
  }

  const lat = parseFloat(latParam);
  const lng = parseFloat(lngParam);
  const k = kParam ? parseInt(kParam) : 3;

  const recommendations = getRecommendations(lat, lng, k);
  return NextResponse.json(recommendations);
}