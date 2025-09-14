'use client';

import React, { useEffect, useState } from 'react';
import { Map } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import { useSpring, animated } from 'react-spring';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as h3 from 'h3-js';

const MAP_STYLE =
	'https://api.maptiler.com/maps/streets-v2/style.json?key=SOILGxH0ir4WCwANkaxa';

const INITIAL_VIEW_STATE = {
	longitude: 71.4704,
	latitude: 51.1801,
	zoom: 11,
	pitch: 45,
	bearing: 0,
};

// Gradient: blue (low) -> yellow -> red (high)
const DEMAND_COLOR_SCALE = [
	[0, 0, 255],
	[255, 255, 0],
	[255, 0, 0],
];

interface MapVisualizationProps {
	dataLoaded: boolean;
	forecastHorizon: string;
}

export default function MapVisualization({
	dataLoaded,
	forecastHorizon,
}: MapVisualizationProps) {
	const [gridData, setGridData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!dataLoaded) return;

		const fetchData = async () => {
			setLoading(true);
			setError(null);

			try {
				const gridRes = await fetch(`/api/grid`);
				if (gridRes.ok) {
					const gridResult = await gridRes.json();
					// Handle new API response format with metadata
					const gridData = gridResult.grid || gridResult;
					console.log(`Map: Received ${gridData.length} grid cells`, gridResult.metadata);
					setGridData(gridData);
				} else {
					console.error('Failed to fetch grid data:', gridRes.status, gridRes.statusText);
					setGridData([]);
				}
			} catch (err) {
				console.error('Error fetching map data:', err);
				setError('Failed to load map data. Please try again.');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [dataLoaded, forecastHorizon]);

	const animationProps = useSpring({
		opacity: 1, // Always show the map container
		scale: dataLoaded ? 1 : 0.8,
		config: { duration: 500 },
	});

	const getTooltip = ({ object }: any) => {
		if (!object) return null;
		if (object.hasOwnProperty('trips')) {
			return `H3: ${object.h3}\nTrips: ${object.trips}`;
		}
		if (object.hasOwnProperty('demandPred')) {
			return `H3: ${
				object.h3
			}\nPredicted Demand: ${object.demandPred.toFixed(2)}`;
		}
		if (object.hasOwnProperty('type')) {
			return `H3: ${object.h3}\nAnomaly: ${
				object.type
			}\nScore: ${object.score.toFixed(2)}`;
		}
		if (object.hasOwnProperty('driverId')) {
			return `Driver: ${object.driverId}\nAction: Move to optimal zone`;
		}
		return null;
	};

	// Create fallback scatterplot data from H3 cells
	const scatterplotData = gridData
		.map((cell: any) => {
			try {
				const [lat, lng] = h3.cellToLatLng(cell.h3);
				return {
					position: [lng, lat],
					trips: cell.trips || 0,
					h3: cell.h3,
					avgSpd: cell.avgSpd || 0,
				};
			} catch (error) {
				return null;
			}
		})
		.filter(Boolean);

	const layers = [
		// Simple scatterplot heatmap
		scatterplotData.length > 0 &&
			new ScatterplotLayer({
				id: 'demand-heatmap',
				data: scatterplotData,
				pickable: true,
				opacity: 0.8,
				radiusScale: 20,
				radiusMinPixels: 5,
				radiusMaxPixels: 100,
				getPosition: (d: any) => d.position,
				getRadius: (d: any) => Math.max(Math.sqrt(d.trips) * 3, 5),
				getFillColor: (d: any) => {
					const maxTrips = Math.max(
						...scatterplotData.map((cell: any) => cell.trips || 0),
						1
					);
					const intensity = d.trips / maxTrips;
					if (intensity < 0.3) return [0, 100, 255, 200]; // Blue
					if (intensity < 0.7) return [255, 255, 0, 200]; // Yellow
					return [255, 0, 0, 200]; // Red
				},
			}),
	].filter(Boolean);

	return (
		<animated.div
			style={animationProps}
			className="relative w-full h-full rounded-lg overflow-hidden"
		>
			<DeckGL
				layers={layers}
				initialViewState={INITIAL_VIEW_STATE}
				controller={true}
				getTooltip={getTooltip}
			>
				<Map mapStyle={MAP_STYLE} />
			</DeckGL>
			{/* Loading Indicator */}
			{loading && (
				<div className="absolute top-4 left-4 geo-card p-3">
					<div className="flex items-center space-x-2 text-geo-text-light">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-geo-accent-blue"></div>
						<span className="text-sm text-geo-text-muted">
							Loading map data...
						</span>
					</div>
				</div>
			)}

			{/* Error Indicator */}
			{error && (
				<div className="absolute top-4 left-4 geo-card border-geo-error/40 p-3">
					<span className="text-sm text-geo-error">{error}</span>
				</div>
			)}

			{/* Data Not Loaded Warning */}
			{!dataLoaded && (
				<div className="absolute top-4 left-4 geo-card p-3">
					<span className="text-sm text-geo-text-muted">
						Please load data first to see visualizations
					</span>
				</div>
			)}

			{/* Simple legend */}
			<div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
				<div className="font-semibold mb-2">Demand Heatmap</div>
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-blue-500"></div>
						<span>Low</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
						<span>Medium</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-red-500"></div>
						<span>High</span>
					</div>
				</div>
				<div className="mt-2 pt-2 border-t text-gray-500">
					Points: {scatterplotData.length}
				</div>
			</div>
		</animated.div>
	);
}
