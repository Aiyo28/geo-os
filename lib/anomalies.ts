import { STATE } from './state';
import { haversineDistance, calculateAzimuth as calculateBearing } from './geo';
import { Trajectory, TrajectoryPoint, AnomalyData } from './types';
import { IsolationForest } from 'isolation-forest';

const SUDDEN_STOP_THRESHOLD = -20; // m/s^2, very aggressive deceleration
const CIRCULAR_ROUTE_DISTANCE_THRESHOLD = 0.5; // km, ends within 500m of start
const CIRCULAR_ROUTE_MIN_LENGTH = 2; // km, must be at least 2km long
const ROUTE_DEVIATION_FACTOR = 1.5; // 50% longer than straight line
const ZIGZAG_ANGLE_THRESHOLD = 45; // degrees, sharp turn
const ZIGZAG_COUNT_THRESHOLD = 5; // needs at least 5 sharp turns

export class SafetyAnomalyDetector {
	/**
	 * Main method to detect all types of anomalies in a single trajectory.
	 */
	detectAnomalies(trajectory: Trajectory): AnomalyData[] {
		const anomalies: AnomalyData[] = [];

		if (trajectory.points.length < 2) {
			return [];
		}

		if (this.detectSuddenStops(trajectory)) {
			anomalies.push(
				this.createAnomaly(trajectory, 'sudden_stop', 'high', 1)
			);
		}

		if (this.detectCircularRoute(trajectory)) {
			anomalies.push(
				this.createAnomaly(trajectory, 'circular_route', 'medium', 1)
			);
		}

		const routeDeviationScore = this.detectRouteDeviation(trajectory);
		if (routeDeviationScore > 0) {
			anomalies.push(
				this.createAnomaly(
					trajectory,
					'route_deviation',
					'low',
					routeDeviationScore
				)
			);
		}

		if (this.detectZigzag(trajectory)) {
			anomalies.push(
				this.createAnomaly(trajectory, 'zigzag', 'medium', 1)
			);
		}

		return anomalies;
	}

	/**
	 * 1. Detects sudden stops in unusual places.
	 * A sudden stop is a rapid deceleration.
	 */
	private detectSuddenStops(trajectory: Trajectory): boolean {
		for (let i = 1; i < trajectory.points.length; i++) {
			const p1 = trajectory.points[i - 1];
			const p2 = trajectory.points[i];
			const timeDiff =
				(p2.timestamp.getTime() - p1.timestamp.getTime()) / 1000; // in seconds
			if (timeDiff === 0) continue;

			const acceleration = (p2.speed - p1.speed) / timeDiff; // m/s^2

			if (acceleration < SUDDEN_STOP_THRESHOLD && p2.speed < 1) {
				// Stop occurred not at the start or end
				if (i > 1 && i < trajectory.points.length - 1) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * 2. Detects circular routes (potential fraud).
	 */
	private detectCircularRoute(trajectory: Trajectory): boolean {
		const startPoint = trajectory.points[0];
		const endPoint = trajectory.points[trajectory.points.length - 1];

		const distance = haversineDistance(
			startPoint.lat,
			startPoint.lng,
			endPoint.lat,
			endPoint.lng
		);
		const totalDistance = trajectory.totalDistance;

		return (
			distance < CIRCULAR_ROUTE_DISTANCE_THRESHOLD &&
			totalDistance > CIRCULAR_ROUTE_MIN_LENGTH
		);
	}

	/**
	 * 3. Detects significant deviation from the optimal route.
	 * Uses straight-line distance as a proxy for the optimal route.
	 */
	private detectRouteDeviation(trajectory: Trajectory): number {
		const startPoint = trajectory.points[0];
		const endPoint = trajectory.points[trajectory.points.length - 1];
		const straightLineDistance = haversineDistance(
			startPoint.lat,
			startPoint.lng,
			endPoint.lat,
			endPoint.lng
		);

		if (straightLineDistance === 0) return 0;

		const deviationFactor = trajectory.totalDistance / straightLineDistance;
		return deviationFactor > ROUTE_DEVIATION_FACTOR ? deviationFactor : 0;
	}

	/**
	 * 4. Detects zigzag movement.
	 */
	private detectZigzag(trajectory: Trajectory): boolean {
		let zigzagCount = 0;
		const bearings: number[] = [];

		for (let i = 0; i < trajectory.points.length - 1; i++) {
			const p1 = trajectory.points[i];
			const p2 = trajectory.points[i + 1];
			bearings.push(calculateBearing(p1.lat, p1.lng, p2.lat, p2.lng));
		}

		for (let i = 1; i < bearings.length; i++) {
			let bearingChange = Math.abs(bearings[i] - bearings[i - 1]);
			if (bearingChange > 180) {
				// Handle wrap-around from 360 to 0
				bearingChange = 360 - bearingChange;
			}
			if (bearingChange > ZIGZAG_ANGLE_THRESHOLD) {
				zigzagCount++;
			}
		}

		return zigzagCount >= ZIGZAG_COUNT_THRESHOLD;
	}

	/**
	 * 5. Uses Isolation Forest for general statistical anomaly detection.
	 */
	isolationForest(trajectories: Trajectory[]): Trajectory[] {
		if (trajectories.length < 10) return []; // Not enough data for IF

		const features = trajectories.map((t) => ({
			avgSpeed: t.avgSpeed,
			totalDistance: t.totalDistance,
			totalDuration: t.totalDuration,
			pointsLength: t.points.length,
		}));

		const isolationForest = new IsolationForest(100);
		isolationForest.fit(features);
		const scores = isolationForest.predict(features);

		const anomalousTrajectories: Trajectory[] = [];
		for (let i = 0; i < scores.length; i++) {
			if (scores[i] > 0.6) {
				// Threshold can be tuned
				trajectories[i].anomalyScore = scores[i];
				anomalousTrajectories.push(trajectories[i]);
			}
		}
		return anomalousTrajectories;
	}

	/**
	 * Uses DBSCAN clustering to find anomalous routes.
	 */
	dbscanClustering(trajectories: Trajectory[]): Trajectory[] {
		return [];
	}

	public createAnomaly(
		trajectory: Trajectory,
		type: string,
		severity: 'low' | 'medium' | 'high',
		score: number
	): AnomalyData {
		return {
			id: trajectory.vehicleId,
			ts: trajectory.points[0].timestamp.toISOString(),
			h3: trajectory.points[0].h3Index,
			type: type,
			score: score,
			severity: severity,
		};
	}
}

/**
 * Main function to find anomalies in all trajectories.
 * Integrates the new SafetyAnomalyDetector.
 */
export function findAnomalies(from?: string, to?: string): AnomalyData[] {
	const detector = new SafetyAnomalyDetector();
	let allAnomalies: AnomalyData[] = [];

	const trajectories = Array.from(STATE.trajectories.values()) as Trajectory[];

	// Per-trajectory anomalies
	for (const trajectory of trajectories) {
		const anomalies = detector.detectAnomalies(trajectory);
		allAnomalies.push(...anomalies);
	}

	// Statistical anomalies across all trajectories
	const isolationForestAnomalies = detector.isolationForest(trajectories);
	for (const t of isolationForestAnomalies) {
		allAnomalies.push(
			detector.createAnomaly(
				t,
				'statistical',
				'high',
				t.anomalyScore || 0
			)
		);
	}

	const dbscanAnomalies = detector.dbscanClustering(trajectories);
	for (const t of dbscanAnomalies) {
		allAnomalies.push(
			detector.createAnomaly(t, 'route_cluster_outlier', 'medium', 1)
		);
	}

	// Remove duplicates by trajectory ID and type
	const uniqueAnomalies = Array.from(
		new Map(allAnomalies.map((a) => [`${a.id}-${a.type}`, a])).values()
	);

	return uniqueAnomalies;
}

export function generateSafetyRecommendations(
	anomalies: AnomalyData[]
): string[] {
	const recommendations: string[] = [];
	if (anomalies.some((a) => a.type === 'sudden_stop')) {
		recommendations.push(
			'Review driver behavior for sudden stops. Consider driver coaching.'
		);
	}
	if (anomalies.some((a) => a.type === 'route_deviation')) {
		recommendations.push(
			'Investigate route deviations. Check for road closures or inefficient routing.'
		);
	}
	if (anomalies.length > 10) {
		recommendations.push(
			'High number of anomalies detected. A general review of driver performance is recommended.'
		);
	}
	if (recommendations.length === 0) {
		recommendations.push(
			'All clear. No specific safety recommendations at this time.'
		);
	}
	return recommendations;
}
