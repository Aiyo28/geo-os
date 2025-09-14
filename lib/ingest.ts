import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import * as h3 from 'h3-js';
import { STATE, H3Cell, resetState } from './state';
import { haversineDistance } from './geo';
import { RawGPSData } from './types';

export async function ingestCSV(path: string) {
	console.log(`Starting CSV ingestion from: ${path}`);
	const raw = fs.readFileSync(path, 'utf8');
	const rows: RawGPSData[] = parse(raw, {
		columns: true,
		skip_empty_lines: true,
	});

	const trajectories = new Map<string, RawGPSData[]>();
	let invalidRows = 0;
	for (const r of rows) {
		const lat = r.lat;
		const lng = r.lng;
		const spd = r.spd;

		if (
			lat < 50.5 ||
			lat > 52.0 ||
			lng < 70.5 ||
			lng > 72.5 ||
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
		trajectories.get(r.randomized_id)!.push(r);
	}
	console.log(
		`Processed ${rows.length} rows, found ${trajectories.size} trajectories, skipped ${invalidRows} invalid rows.`
	);

	resetState();

	for (const [id, points] of trajectories.entries()) {
		points.sort((a, b) => a.seq - b.seq);

		let totalDistance = 0;
		let totalDuration = 0;
		let totalSpeed = 0;

		const trajectoryPoints: Array<{
			lat: number;
			lng: number;
			speed: number;
			timestamp: Date;
			h3Index: string;
			seq: number;
		}> = [];

		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			const lat = p.lat;
			const lng = p.lng;
			const spd = p.spd;
			const timestamp = Date.now() + i * 1000; // Dummy timestamp
			const h3Index = h3.latLngToCell(lat, lng, 8);
			const seq = p.seq;

			if (i > 0) {
				const prevPoint = trajectoryPoints[i - 1];
				totalDistance += haversineDistance(
					prevPoint.lat,
					prevPoint.lng,
					lat,
					lng
				);
				totalDuration +=
					(timestamp - prevPoint.timestamp.getTime()) / 1000; // in seconds
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

		STATE.trajectories.set(id, {
			vehicleId: id,
			points: trajectoryPoints,
			totalDistance,
			totalDuration,
			avgSpeed,
		});

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
		`H3 grid processing complete. Found ${affectedZones.size} unique zones.`
	);

	return {
		rows_ingested: rows.length,
		valid_rows: rows.length - invalidRows,
		vehicles: trajectories.size,
		zones_affected: affectedZones.size,
		total_grid_cells: totalGridCells,
		filtered_errors: invalidRows,
	};
}
