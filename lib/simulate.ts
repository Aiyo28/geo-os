import { STATE } from './state';
import { H3Cell } from './state';
import { mean, standardDeviation } from 'simple-statistics';

// KPI Calculation - aligned with lib/kpi.ts for consistency
function calculateKPIs(grid: Map<string, H3Cell>) {
    if (grid.size === 0) {
        return {
            eta_avg: 0,
            util_avg: 0,
            co2_emissions_proxy: 0,
            demand_supply_gap: 0,
        };
    }

    let totalTrips = 0;
    let totalSpd = 0;
    let demandCells = 0;
    const demandThreshold = 10; // Same as kpi.ts

    for (const cell of grid.values()) {
        totalTrips += cell.trips;
        totalSpd += cell.avgSpd * cell.trips;
        if (cell.trips > demandThreshold) {
            demandCells++;
        }
    }

    const avgSpd = totalTrips > 0 ? totalSpd / totalTrips : 0;
    const coverage = grid.size > 0 ? demandCells / grid.size : 0;

    const avg_pickup_dist = 2.0; // Same as kpi.ts
    // Use same calculation as lib/kpi.ts for consistency
    const eta_avg = avgSpd > 0 ? avg_pickup_dist / avgSpd * 60 : 0; // in minutes

    // Cap ETA at reasonable values and handle extreme cases
    const cappedEta = Math.min(Math.max(eta_avg, 0), 60); // Cap between 0 and 60 minutes

    // Utilization: ratio of demand cells to total cells (0-1)
    const util_avg = coverage;

    // CO2 proxy: use fixed value like kpi.ts for consistency
    const co2_emissions_proxy = 1.0;

    // Demand/Supply Gap: std dev of trips across cells
    const trips = Array.from(grid.values()).map(c => c.trips);
    const demand_supply_gap = trips.length > 1 ? standardDeviation(trips) : 0;

    return {
        eta_avg: parseFloat(cappedEta.toFixed(1)),
        util_avg: parseFloat(util_avg.toFixed(2)),
        co2_emissions_proxy: parseFloat(co2_emissions_proxy.toFixed(1)),
        demand_supply_gap: parseFloat(demand_supply_gap.toFixed(2)),
    };
}

// Simulation Logic
export function runSimulation(recommendations: any[], relocateShare: number) {
    const originalGrid = STATE.currentGrid;
    if (!originalGrid || originalGrid.size === 0) {
        return { error: "No data to simulate." };
    }

    // 1. Calculate KPIs *before* simulation
    const kpi_before = calculateKPIs(originalGrid);

    // 2. Create a deep copy of the grid to simulate on
    const simGrid = new Map<string, H3Cell>(JSON.parse(JSON.stringify(Array.from(originalGrid))));

    // 3. Identify supply-rich and supply-poor zones
    const sortedCells = Array.from(simGrid.values()).sort((a, b) => a.trips - b.trips);
    const supplyPoorZones = new Set(recommendations.map(r => r.h3));
    const supplyRichZones = sortedCells.filter(c => c.trips > mean(sortedCells.map(cell => cell.trips)) && !supplyPoorZones.has(c.h3));

    if (supplyRichZones.length === 0) {
        return { kpi_before, kpi_after: kpi_before, message: "No supply-rich zones found to reallocate from." };
    }

    // 4. Simulate relocation
    let relocatedTrips = 0;
    // Calculate total trips to move based on the share from rich zones
    const totalTripsInRichZones = supplyRichZones.reduce((acc, zone) => acc + zone.trips, 0);
    const totalTripsToRelocate = Math.floor(totalTripsInRichZones * relocateShare);

    // Take trips from rich zones
    for (const richZone of supplyRichZones) {
        const tripsToMove = Math.floor(richZone.trips * relocateShare);
        if (tripsToMove > 0) {
            richZone.trips -= tripsToMove;
            relocatedTrips += tripsToMove;
        }
    }

    // Distribute relocated trips to recommended (poor) zones
    if (supplyPoorZones.size > 0) {
        const tripsPerPoorZone = Math.floor(relocatedTrips / supplyPoorZones.size);
        if (tripsPerPoorZone > 0) {
            for (const poorZoneH3 of supplyPoorZones) {
                const poorZone = simGrid.get(poorZoneH3);
                if (poorZone) {
                    poorZone.trips += tripsPerPoorZone;
                }
            }
        }
    }
    
    // 5. Recalculate KPIs on the *simulated* grid
    const kpi_after = calculateKPIs(simGrid);

    return { kpi_before, kpi_after, relocated_trips: relocatedTrips };
}