'use client';

import React, { useEffect, useState } from 'react';
import { Map } from 'react-map-gl/maplibre';
import { DeckGL } from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
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
	simulationMode?: 'current' | 'optimized';
	simulationResult?: Record<string, unknown> | null;
}

export default function SimpleHeatmap({
	dataLoaded,
	forecastHorizon,
	simulationMode = 'current',
	simulationResult,
}: SimpleHeatmapProps) {
	const [gridData, setGridData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [viewState, setViewState] = useState(WORLD_VIEW_STATE);

	useEffect(() => {
		if (!dataLoaded) return;

		const fetchData = async () => {
			setLoading(true);
			try {
				// Add small delay to ensure data processing is complete
				await new Promise(resolve => setTimeout(resolve, 500));

				const res = await fetch('/api/grid');
				if (res.ok) {
					const data = await res.json();
					// Handle new API response format with metadata
					const gridData = data.grid || data;
					console.log(`SimpleHeatmap: Received ${gridData.length} grid cells`, data.metadata);

					// Only update if we got valid data
					if (gridData && gridData.length > 0) {
						setGridData(gridData);

						// Calculate bounds from the data and set view
						const lats = gridData.map((cell: any) => {
							try {
								const [lat] = h3.cellToLatLng(cell.h3);
								return lat;
							} catch {
								return null;
							}
						}).filter(Boolean);

						const lngs = gridData.map((cell: any) => {
							try {
								const [, lng] = h3.cellToLatLng(cell.h3);
								return lng;
							} catch {
								return null;
							}
						}).filter(Boolean);

						if (lats.length > 0 && lngs.length > 0) {
							const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
							const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

							setViewState({
								longitude: centerLng,
								latitude: centerLat,
								zoom: 12,
								pitch: 0,
								bearing: 0,
							});
						}
					}
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [dataLoaded, forecastHorizon, simulationMode, simulationResult]);

	// Prepare H3 hexagon data based on simulation mode
	const getDataForMode = () => {
		if (simulationMode === 'optimized' && simulationResult?.simulated_grid) {
			return (simulationResult.simulated_grid as any[]).map((cell: any) => ({
				hex: cell.h3,
				trips: cell.trips || 0,
				isSimulated: true,
			}));
		}
		return gridData.map((cell: any) => ({
			hex: cell.h3,
			trips: cell.trips || 0,
			isSimulated: false,
		}));
	};

	const hexagonData = getDataForMode();

	// Handle case when no data is available
	if (hexagonData.length === 0) {
		return (
			<div className="w-full h-full relative">
				<DeckGL
					layers={[]}
					viewState={viewState}
					onViewStateChange={({ viewState }) => setViewState(viewState)}
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

	const maxTrips = Math.max(...hexagonData.map((d: any) => d.trips), 1);

	const layers = [
		new H3HexagonLayer({
			id: 'h3-hexagon-layer',
			data: hexagonData,
			pickable: true,
			wireframe: false,
			filled: true,
			extruded: false,
			getHexagon: (d: any) => d.hex,
			getFillColor: (d: any) => {
				const intensity = d.trips / maxTrips;
				let baseColor;

				if (simulationMode === 'optimized') {
					// Distinct green-based color scheme for optimized mode
					if (intensity < 0.2) baseColor = [46, 125, 50]; // Dark Green
					else if (intensity < 0.5) baseColor = [102, 187, 106]; // Medium Green
					else if (intensity < 0.8) baseColor = [156, 204, 101]; // Light Green
					else baseColor = [255, 235, 59]; // Bright Yellow for peak optimization

					return [...baseColor, 240]; // Higher opacity for optimized
				} else {
					// Original blue-to-red scheme for current mode
					if (intensity < 0.2) baseColor = [74, 144, 226]; // Blue
					else if (intensity < 0.5) baseColor = [255, 193, 7]; // Yellow
					else if (intensity < 0.8) baseColor = [255, 152, 0]; // Orange
					else baseColor = [244, 67, 54]; // Red

					return [...baseColor, 200];
				}
			},
			getLineColor: (d: any) => {
				// Thicker white border for simulated hexagons
				if (simulationMode === 'optimized') {
					return [255, 255, 255, 120];
				}
				return [255, 255, 255, 80];
			},
			lineWidthMinPixels: simulationMode === 'optimized' ? 2 : 1,
		}),
	];

	if (!dataLoaded) {
		return (
			<div className="w-full h-full relative">
				<DeckGL
					layers={[]}
					viewState={viewState}
					onViewStateChange={({ viewState }) => setViewState(viewState)}
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
					viewState={viewState}
					onViewStateChange={({ viewState }) => setViewState(viewState)}
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
		<div className="w-full h-full relative">
			<DeckGL
				layers={layers}
				viewState={viewState}
				onViewStateChange={({ viewState }) => setViewState(viewState)}
				controller={true}
				getTooltip={({ object }) =>
					object ? `H3: ${object.hex}\nTrips: ${object.trips}` : null
				}
			>
				<Map mapStyle={MAP_STYLE} />
			</DeckGL>

			{/* Legend moved to bottom right */}
			<div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 text-xs shadow-lg border border-gray-200">
				<div className="font-semibold mb-2 flex items-center gap-2">
					{simulationMode === 'optimized' ? (
						<>
							<span className="h-2 w-2 rounded-full bg-green-500"></span>
							Optimized Demand
						</>
					) : (
						<>
							<span className="h-2 w-2 rounded-full bg-blue-500"></span>
							Current Demand
						</>
					)}
				</div>
				<div className="space-y-1">
					{simulationMode === 'optimized' ? (
						<>
							<div className="flex items-center gap-2">
								<div className="w-4 h-3 bg-green-800 border border-white/50" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
								<span>Low ({Math.round(maxTrips * 0.2)})</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-3 bg-green-500 border border-white/50" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
								<span>Medium ({Math.round(maxTrips * 0.5)})</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-3 bg-green-300 border border-white/50" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
								<span>High ({Math.round(maxTrips * 0.8)})</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-3 bg-yellow-300 border border-white/50" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
								<span>Peak ({maxTrips})</span>
							</div>
						</>
					) : (
						<>
							<div className="flex items-center gap-2">
								<div className="w-4 h-3 bg-blue-500 border border-white/50" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
								<span>Low ({Math.round(maxTrips * 0.2)})</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-3 bg-yellow-500 border border-white/50" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
								<span>Medium ({Math.round(maxTrips * 0.5)})</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-3 bg-orange-500 border border-white/50" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
								<span>High ({Math.round(maxTrips * 0.8)})</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-3 bg-red-500 border border-white/50" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
								<span>Peak ({maxTrips})</span>
							</div>
						</>
					)}
				</div>
				<div className="mt-2 pt-2 border-t border-gray-200 text-gray-500">
					Hexagons: {hexagonData.length}
				</div>
			</div>
		</div>
	);
}