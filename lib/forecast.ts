import { STATE } from './state';

export function getForecast(top: number) {
  const allForecasts = getAllForecasts();
  // Sort by predicted demand, descending
  allForecasts.sort((a, b) => b.demandPred - a.demandPred);
  return allForecasts.slice(0, top);
}

export function getAllForecasts() {
  const currentGrid = STATE.currentGrid;

  if (currentGrid.size === 0) {
    return [];
  }

  const forecasts = Array.from(currentGrid.values()).map((cell: any) => {
    // For now, predicted demand is current demand as there's no time series
    const demandPred = cell.trips || 0;

    // Simple confidence interval
    const lo = demandPred * 0.8;
    const hi = demandPred * 1.2;

    return {
      h3: cell.h3,
      demandPred,
      lo,
      hi,
    };
  });

  return forecasts;
}