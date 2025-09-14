"use client";

import React from 'react';

interface LineChartProps {
  data: any;
  showConfidenceInterval: any;
  annotations: any;
}

export function LineChart({ data, showConfidenceInterval, annotations }: LineChartProps) {
  return (
    <div className="p-4 bg-gray-800/20 rounded-lg h-64 flex items-center justify-center">
      <p className="text-geo-text-muted">Line Chart Placeholder</p>
    </div>
  );
}
