import { NextResponse } from 'next/server';
import { getAllForecasts } from '@/lib/forecast';

export async function POST(request: Request) {
  // const { horizon, method, includeConfidence } = await request.json();

  // The current implementation of forecast doesn't use these parameters.
  // We will call getAllForecasts as a stand-in.
  // A future implementation could use the parameters to select different models or horizons.
  
  const result = getAllForecasts();
  
  return NextResponse.json(result);
}
