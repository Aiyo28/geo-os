import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { ingestCSV } from '@/lib/ingest';

export async function POST(request: NextRequest) {
	try {
		console.log('Ingesting data...');

		// Check content type to determine if there's a file upload
		const contentType = request.headers.get('content-type') || '';
		let file = null;

		if (contentType.includes('multipart/form-data')) {
			// Handle file upload
			const formData = await request.formData();
			file = formData.get('file') as File;
		}

		let result;

		if (file) {
			// Handle file upload
			console.log('Processing uploaded file:', file.name);

			// Convert file to text
			const fileContent = await file.text();

			// For now, save to a temporary location and process
			// In production, you'd want to save to a proper file system or database
			result = await ingestCSVFromContent(fileContent, file.name);
		} else {
			// Use sample data as fallback
			console.log('No file provided, using sample data');
			result = await ingestCSV('data/astana_sample_small.csv');
		}

		console.log('Ingestion complete:', result);
		return NextResponse.json(result);
	} catch (error) {
		console.error('Ingestion error:', error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: 'Unknown error occurred',
				rows_ingested: 0,
			},
			{ status: 500 }
		);
	}
}

// Helper function to process CSV content directly
async function ingestCSVFromContent(content: string, filename: string) {
	// Parse CSV content
	const lines = content.split('\n').filter((line) => line.trim());
	const headers = lines[0]?.split(',').map((h) => h.trim()) || [];

	// Basic validation
	if (lines.length < 2) {
		throw new Error(
			'CSV file must contain at least a header and one data row'
		);
	}

	// Process the CSV data similar to the file-based ingestion
	const { parse } = await import('csv-parse/sync');
	const rows = parse(content, { columns: true, skip_empty_lines: true });

	// Import required modules
	const h3 = await import('h3-js');
	const { STATE, resetState } = await import('@/lib/state');
	const { haversineDistance } = await import('@/lib/geo');

	// Reset state before processing new data
	resetState();

	const trajectories = new Map();
	let invalidRows = 0;

	// Process each row
	for (const r of rows) {
		const lat = parseFloat(r.lat);
		const lng = parseFloat(r.lng);
		const spd = parseFloat(r.spd);

		// Basic validation (adjust bounds as needed)
		if (
			isNaN(lat) ||
			isNaN(lng) ||
			isNaN(spd) ||
			lat < -90 ||
			lat > 90 ||
			lng < -180 ||
			lng > 180 ||
			!r.randomized_id ||
			r.seq === undefined ||
			spd < 0 ||
			spd > 200
		) {
			invalidRows++;
			continue;
		}

		if (!trajectories.has(r.randomized_id)) {
			trajectories.set(r.randomized_id, []);
		}
		trajectories.get(r.randomized_id).push(r);
	}

	// Process trajectories and populate grid
	for (const [id, points] of trajectories.entries()) {
		points.sort((a, b) => parseInt(a.seq) - parseInt(b.seq));

		let totalDistance = 0;
		let totalDuration = 0;
		let totalSpeed = 0;

		const trajectoryPoints: any[] = [];
		for (let i = 0; i < points.length; i++) {
			const p: any = points[i];
			const lat = parseFloat(p.lat);
			const lng = parseFloat(p.lng);
			const spd = parseFloat(p.spd);
			const timestamp = Date.now() + i * 1000; // Dummy timestamp
			const h3Index = h3.latLngToCell(lat, lng, 8);
			const seq = parseInt(p.seq);

			if (i > 0) {
				const prevPoint = trajectoryPoints[i - 1];
				totalDistance += haversineDistance(
					prevPoint.lat,
					prevPoint.lng,
					lat,
					lng
				);
				totalDuration +=
					(timestamp - prevPoint.timestamp.getTime()) / 1000;
			}
			totalSpeed += spd;

			trajectoryPoints.push({
				lat,
				lng,
				speed: spd,
				timestamp: new Date(timestamp),
				h3Index,
				seq,
			});
		}

		const avgSpeed =
			trajectoryPoints.length > 0
				? totalSpeed / trajectoryPoints.length
				: 0;

		// Store trajectory
		STATE.trajectories.set(id, {
			vehicleId: id,
			points: trajectoryPoints,
			totalDistance,
			totalDuration,
			avgSpeed,
		});

		// Populate grid cells
		for (const point of trajectoryPoints) {
			try {
				const h3Index = h3.latLngToCell(point.lat, point.lng, 8);
				const currentGrid = STATE.currentGrid;

				const cell = currentGrid.get(h3Index) || {
					h3: h3Index,
					trips: 0,
					avgSpd: 0,
					wait_proxy: 0,
				};

				cell.trips++;
				cell.avgSpd =
					(cell.avgSpd * (cell.trips - 1) + point.speed) / cell.trips;
				if (point.speed < 5) cell.wait_proxy++;

				currentGrid.set(h3Index, cell);
			} catch (error) {
				// Silently ignore H3 processing errors for individual points
			}
		}
	}

	const affectedZones = new Set([...STATE.currentGrid.keys()]);
	const totalGridCells = STATE.currentGrid.size;

	console.log(
		`CSV processing complete: ${totalGridCells} grid cells populated`
	);

	return {
		rows_ingested: rows.length,
		valid_rows: rows.length - invalidRows,
		vehicles: trajectories.size,
		zones_affected: affectedZones.size,
		total_grid_cells: totalGridCells,
		filtered_errors: invalidRows,
		filename: filename,
		message: `Successfully processed ${
			rows.length - invalidRows
		} valid rows from ${filename}`,
	};
}
