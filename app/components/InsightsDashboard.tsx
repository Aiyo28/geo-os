"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "./charts/LineChart";
import { HeatmapChart } from "./charts/HeatmapChart";
import { BeforeAfterComparison } from "./charts/BeforeAfterComparison";
import { RecommendationList } from "./charts/RecommendationList";

// Dummy data for now, as the props are not fully defined.
const demandForecast: any[] = [];
const safetyScores: any[] = [];
const currentKPIs: any = {};
const optimizedKPIs: any = {};
const topRelocationZones: any[] = [];

export function InsightsDashboard({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Прогноз спроса с доверительными интервалами */}
      <Card>
        <CardHeader>
          <CardTitle>Прогноз спроса</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart 
            data={demandForecast}
            showConfidenceInterval={true}
            annotations={[
              { time: 'rush_hour', label: 'Пиковый спрос' }
            ]}
          />
        </CardContent>
      </Card>

      {/* 2. Safety Score по районам */}
      <Card>
        <CardHeader>
          <CardTitle>Безопасность маршрутов</CardTitle>
        </CardHeader>
        <CardContent>
          <HeatmapChart 
            title="Безопасность маршрутов"
            data={safetyScores}
            colorScale={['green', 'yellow', 'red']}
          />
        </CardContent>
      </Card>

      {/* 3. Симуляция оптимизации */}
      <Card>
        <CardHeader>
          <CardTitle>Симуляция оптимизации</CardTitle>
        </CardHeader>
        <CardContent>
          <BeforeAfterComparison
            before={currentKPIs}
            after={optimizedKPIs}
            metrics={['ETA', 'Utilization', 'CO2']}
          />
        </CardContent>
      </Card>

      {/* 4. Топ-5 зон для релокации */}
      <Card>
        <CardHeader>
          <CardTitle>Топ-5 зон для релокации</CardTitle>
        </CardHeader>
        <CardContent>
          <RecommendationList zones={topRelocationZones} />
        </CardContent>
      </Card>
    </div>
  );
}