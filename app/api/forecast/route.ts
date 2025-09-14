import { NextResponse } from 'next/server';
import { getForecast } from '@/lib/forecast';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topParam = searchParams.get('top');
  const top = topParam ? parseInt(topParam) : 20;

  const forecast = getForecast(top);
  return NextResponse.json(forecast);
}