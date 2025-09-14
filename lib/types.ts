// Type definitions for the geo-os system

// Raw data types (CSV input) - Updated for astana_geo_reduced.csv
export interface RawGPSData {
	randomized_id: string;
	lat: number;
	lng: number;
	spd: number;
	seq: number;
}

// Legacy type for compatibility
export interface RawTripData {
	randomized_id: string;
	lat: number;
	lng: number;
	alt: number;
	spd: number;
	azm: number;
	timestamp: string;
}

// Processed trajectory from GPS points
export interface Trajectory {
	vehicleId: string;
	points: TrajectoryPoint[];
	totalDistance: number;
	totalDuration: number;
	avgSpeed: number;
	anomalyScore?: number;
}

export interface TrajectoryPoint {
	lat: number;
	lng: number;
	speed: number;
	timestamp: Date;
	h3Index: string;
	seq: number;
}

export interface Location {
	lat: number;
	lng: number;
	timestamp: Date;
}

export interface Driver {
	id: string;
	name: string;
	currentLocation: Location;
	status: 'available' | 'busy' | 'offline';
	rating: number;
	vehicleType: string;
}

export interface Trip {
	id: string;
	driverId: string;
	passengerId: string;
	startLocation: Location;
	endLocation: Location;
	startTime: Date;
	endTime?: Date;
	status:
		| 'requested'
		| 'accepted'
		| 'in_progress'
		| 'completed'
		| 'cancelled';
	fare: number;
	distance: number;
	duration?: number;
}

// H3 Grid cell data
export interface GridCell {
	h3: string; // H3 hexagon ID
	trips: number;
	avgSpd: number;
	wait: number; // wait_proxy
	lat: number;
	lng: number;
	lastUpdated: Date;
}

// Hour-based aggregation
export interface HourlyGridData {
	hour: string; // YYYY-MM-DDTHH:00
	cells: GridCell[];
}

// Forecast data
export interface ForecastData {
	h3: string;
	demandPred: number;
	lo: number; // lower bound
	hi: number; // upper bound
}

// Driver recommendation
export interface RecommendationData {
	h3: string;
	center_lat: number;
	center_lng: number;
	score: number;
	eta_gain_minutes: number;
}

// Anomaly detection
export interface AnomalyData {
	id: string;
	ts: string;
	h3: string;
	type: string;
	score: number;
    severity: 'low' | 'medium' | 'high';
}

// KPI metrics
export interface KPIMetrics {
	eta: number; // average ETA in minutes
	coverage: number; // coverage percentage 0-1
	pickup_dist: number; // average pickup distance in km
	anomalies_per_1k: number; // anomalies per 1000 trips
	co2_proxy: number; // CO2 proxy metric
}

// Simulation results
export interface SimulationResult {
	kpi_baseline: KPIMetrics;
	kpi_after: KPIMetrics;
	delta: KPIMetrics;
}

export interface SimulationScenario {
	id: string;
	name: string;
	description: string;
	parameters: {
		driverPercentage: number;
		demandMultiplier: number;
		supplyMultiplier: number;
		weatherCondition?: string;
		eventType?: string;
	};
	results?: {
		kpis: KPIMetrics;
		impact: Record<string, number>;
		recommendations: string[];
	};
}

export interface DataBucket {
	id: string; // timestamp-based bucket ID
	startTime: Date;
	endTime: Date;
	trips: Trip[];
	drivers: Driver[];
	anomalies: AnomalyData[];
	lastProcessed: Date;
}

export interface SystemConfig {
	gridResolution: number; // H3 resolution (default: 7)
	bucketSizeMinutes: number; // Data bucket size (default: 60)
	forecastHorizonHours: number; // Forecast horizon (default: 24)
	anomalyThreshold: number; // Anomaly detection threshold (default: 0.1)
	simulationDriverPercentage: number; // Percentage of drivers in simulation (default: 10)
}

export interface APIResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
	timestamp: string;
}

export interface MapLayer {
	id: string;
	type: 'heatmap' | 'scatter' | 'polygon' | 'line';
	data: any[];
	visible: boolean;
	opacity: number;
	color: string;
	size?: number;
}

export interface MapViewState {
	longitude: number;
	latitude: number;
	zoom: number;
	pitch: number;
	bearing: number;
	layers: MapLayer[];
}
