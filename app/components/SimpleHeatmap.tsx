'use client';

import React, { useEffect, useState } from 'react';
import { Map } from 'react-map-gl/maplibre';
import { DeckGL } from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as h3 from 'h3-js';

const MAP_STYLE =
	'https://api.maptiler.com/maps/streets-v2/style.json?key=SOILGxH0ir4WCwANkaxa';

const INITIAL_VIEW_STATE = {
	longitude: 71.4704,
	latitude: 51.1801,
	zoom: 11,
	pitch: 0,
	bearing: 0,
};

const WORLD_VIEW_STATE = {
	longitude: 0,
	latitude: 20,
	zoom: 2,
	pitch: 0,
	bearing: 0,
};

interface SimpleHeatmapProps {
	dataLoaded: boolean;
	forecastHorizon: string;
}

export default function SimpleHeatmap({
	dataLoaded,
	forecastHorizon,
}: SimpleHeatmapProps) {
	const [gridData, setGridData] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!dataLoaded) return;

		const fetchData = async () => {
			setLoading(true);
			try {
				const res = await fetch('/api/grid');
				if (res.ok) {
					const data = await res.json();
					// Handle new API response format with metadata
					const gridData = data.grid || data;
					console.log(`SimpleHeatmap: Received ${gridData.length} grid cells`, data.metadata);
					setGridData(gridData);
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [dataLoaded, forecastHorizon]);

	// Convert H3 data to scatterplot points
	const scatterData = gridData
		.map((cell: any) => {
			try {
				const [lat, lng] = h3.cellToLatLng(cell.h3);
				return {
					position: [lng, lat],
					trips: cell.trips || 0,
					h3: cell.h3,
				};
			} catch {
				return null;
			}
		})
		.filter(Boolean);

	// Handle case when no data is available
	if (scatterData.length === 0) {
		return (
			<div className="w-full h-full relative">
				<DeckGL
					layers={[]}
					initialViewState={INITIAL_VIEW_STATE}
					controller={true}
				>
					<Map mapStyle={MAP_STYLE} />
				</DeckGL>

				{/* No data overlay */}
				<div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
					<div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 text-center shadow-xl border border-gray-200">
						<div className="text-lg font-semibold text-gray-800 mb-2">
							📍 No Data Available
						</div>
						<div className="text-gray-600 mb-4">
							No heatmap data found for the current selection
						</div>
						<div className="text-sm text-gray-500">
							Try adjusting the forecast horizon or upload new
							data
						</div>
					</div>
				</div>
			</div>
		);
	}

	const maxTrips = Math.max(...scatterData.map((d: any) => d.trips), 1);

	const layers = [
		new ScatterplotLayer({
			id: 'heatmap-layer',
			data: scatterData,
			pickable: true,
			opacity: 0.7,
			stroked: false,
			filled: true,
			radiusScale: 1,
			radiusMinPixels: 8,
			radiusMaxPixels: 60,
			getPosition: (d: any) => d.position,
			getRadius: (d: any) => Math.max((d.trips / maxTrips) * 40 + 10, 10),
			getFillColor: (d: any) => {
				const intensity = d.trips / maxTrips;
				if (intensity < 0.2) return [74, 144, 226, 180]; // Blue
				if (intensity < 0.5) return [255, 193, 7, 180]; // Yellow
				if (intensity < 0.8) return [255, 152, 0, 180]; // Orange
				return [244, 67, 54, 200]; // Red
			},
		}),
	];

	if (!dataLoaded) {
		return (
			<div className="w-full h-full relative">
				<DeckGL
					layers={[]}
					initialViewState={WORLD_VIEW_STATE}
					controller={true}
				>
					<Map mapStyle={MAP_STYLE} />
				</DeckGL>

				{/* Overlay message */}
				<div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
					<div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 text-center shadow-xl border border-gray-200">
						<div className="text-lg font-semibold text-gray-800 mb-2">
							🌍 Global View
						</div>
						<div className="text-gray-600 mb-4">
							Upload CSV data to see demand heatmaps
						</div>
						<div className="text-sm text-gray-500">
							Use the upload form above to get started
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="w-full h-full relative">
				<DeckGL
					layers={[]}
					initialViewState={INITIAL_VIEW_STATE}
					controller={true}
				>
					<Map mapStyle={MAP_STYLE} />
				</DeckGL>

				{/* Loading overlay */}
				<div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
					<div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 text-center shadow-xl border border-gray-200">
						<div className="flex items-center space-x-3">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
							<span className="text-gray-800 font-medium">
								Loading heatmap data...
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full">
			<DeckGL
				layers={layers}
				initialViewState={INITIAL_VIEW_STATE}
				controller={true}
				getTooltip={({ object }) =>
					object ? `H3: ${object.h3}\nTrips: ${object.trips}` : null
				}
			>
				<Map mapStyle={MAP_STYLE} />
			</DeckGL>

			{/* Simple legend */}
			<div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
				<div className="font-semibold mb-2">Demand Heatmap</div>
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-blue-500"></div>
						<span>Low ({Math.round(maxTrips * 0.3)})</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
						<span>Medium ({Math.round(maxTrips * 0.7)})</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-red-500"></div>
						<span>High ({maxTrips})</span>
					</div>
				</div>
				<div className="mt-2 pt-2 border-t text-gray-500">
					Points: {scatterData.length}
				</div>
			</div>
		</div>
	);
}
