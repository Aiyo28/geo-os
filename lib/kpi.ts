
import { STATE } from './state';
import { findAnomalies } from './anomalies';

export function getKPIs() {
    const grid = STATE.currentGrid;

    if (!grid || grid.size === 0) {
        return { eta: 0, coverage: 0, pickup_dist: 0, anomalies_per_1k: 0, co2_proxy: 0 };
    }

    let totalTrips = 0;
    let totalSpd = 0;
    let demandCells = 0;
    const demandThreshold = 10; // Arbitrary threshold for demand

    for (const cell of grid.values()) {
        totalTrips += cell.trips;
        totalSpd += cell.avgSpd * cell.trips;
        if (cell.trips > demandThreshold) {
            demandCells++;
        }
    }

    const avgSpd = totalTrips > 0 ? totalSpd / totalTrips : 0;
    const coverage = grid.size > 0 ? demandCells / grid.size : 0;
    
    const avg_pickup_dist = 2.0; // Placeholder
    const eta = avgSpd > 0 ? avg_pickup_dist / avgSpd * 60 : 0; // in minutes

    const anomalies = findAnomalies();
    const anomalies_per_1k = STATE.trajectories.size > 0 ? (anomalies.length / STATE.trajectories.size) * 1000 : 0;

    return {
        eta: parseFloat(eta.toFixed(1)),
        coverage: parseFloat(coverage.toFixed(2)),
        pickup_dist: avg_pickup_dist, // Placeholder
        anomalies_per_1k: parseFloat(anomalies_per_1k.toFixed(1)),
        co2_proxy: 1.0, // Placeholder
    };
}
