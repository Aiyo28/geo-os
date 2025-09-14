import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { getGrid } from '@/lib/grid';
import { debugState } from '@/lib/state';

export async function GET(request: Request) {
	try {
		// Debug state first
		const stateInfo = debugState();
		console.log('Grid API state debug:', stateInfo);

		const grid = getGrid();
		const gridArray = Array.from(grid.values());
		console.log(`Grid API: returning ${gridArray.length} grid cells`);

		// Add metadata for debugging
		const response = {
			grid: gridArray,
			metadata: {
				totalCells: gridArray.length,
				lastUpdate: stateInfo.lastUpdate,
				sampleKeys: stateInfo.gridKeys,
			}
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error('Error fetching grid data:', error);
		return NextResponse.json(
			{ error: 'Failed to retrieve grid data' },
			{ status: 500 }
		);
	}
}
