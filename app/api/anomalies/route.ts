import { NextResponse } from 'next/server';
import { findAnomalies } from '@/lib/anomalies';

export async function GET(request: Request) {
  const anomalies = findAnomalies();
  return NextResponse.json(anomalies);
}