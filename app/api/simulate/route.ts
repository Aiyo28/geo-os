import { NextResponse } from 'next/server';
import { runSimulation } from '@/lib/simulate';
import { getRecommendations } from '@/lib/recs';
import { debugState, hasData } from '@/lib/state';

export async function POST(request: Request) {
  try {
    // Debug state first
    const stateInfo = debugState();
    console.log('Simulate API state debug:', stateInfo);

    if (!hasData()) {
      return NextResponse.json({
        error: 'No data to simulate.',
        debug: stateInfo,
        hint: 'Please upload data first using the "Load data" button'
      }, { status: 400 });
    }

    const body = await request.json();
    const relocate_share = body.relocate_share || 0.1;

    // Get top 5 demand zones to be used as relocation targets
    const recommendations = getRecommendations(0, 0, 5);
    console.log(`Found ${recommendations.length} recommendations for simulation`);

    const result = runSimulation(recommendations, relocate_share);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Simulation API Error:', error);
    return NextResponse.json({ error: 'Failed to run simulation', details: error.message }, { status: 500 });
  }
}
