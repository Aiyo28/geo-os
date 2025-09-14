"use client";

import React from 'react';

interface HeatmapChartProps {
  title: any;
  data: any;
  colorScale: any;
}

export function HeatmapChart({ title, data, colorScale }: HeatmapChartProps) {
  return (
    <div className="p-4 bg-gray-800/20 rounded-lg h-64 flex items-center justify-center">
      <p className="text-geo-text-muted">Heatmap Chart Placeholder</p>
    </div>
  );
}
