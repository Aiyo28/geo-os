import { NextResponse } from 'next/server';
import { findAnomalies, generateSafetyRecommendations } from '@/lib/anomalies';

export async function POST(request: Request) {
  const anomalies = findAnomalies();
  
  // Группировка по severity
  const critical = anomalies.filter(a => a.severity === 'high');
  
  const totalAnomalies = anomalies.length;
  const safetyScore = totalAnomalies > 0 ? 100 - (critical.length / totalAnomalies * 100) : 100;

  return NextResponse.json({
    summary: {
      total: totalAnomalies,
      critical: critical.length,
      safetyScore: safetyScore
    },
    anomalies,
    recommendations: generateSafetyRecommendations(anomalies)
  });
}
