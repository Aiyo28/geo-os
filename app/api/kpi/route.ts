import { NextResponse } from 'next/server';
import { getKPIs } from '@/lib/kpi';

export async function GET() {
	const kpis = getKPIs();
	return NextResponse.json(kpis);
}
