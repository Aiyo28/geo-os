
import { getAllForecasts } from './forecast';
import { getH3CellCenter, haversineDistance } from './geo';

export function getRecommendations(lat: number, lng: number, k: number) {
  const allForecasts = getAllForecasts();

  const recommendations = allForecasts.map(forecast => {
    const { lat: cellLat, lng: cellLng } = getH3CellCenter(forecast.h3);
    const dist_km = haversineDistance(lat, lng, cellLat, cellLng);
    const score = forecast.demandPred / (1 + dist_km);

    // Placeholder for eta_gain_minutes
    const eta_gain_minutes = dist_km / 30 * 60 * 0.2; // Assuming 20% time save

    return {
      ...forecast,
      center_lat: cellLat,
      center_lng: cellLng,
      dist_km,
      score,
      eta_gain_minutes,
    };
  });

  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, k);
}
