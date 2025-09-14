"use client";

import React from 'react';

interface BeforeAfterComparisonProps {
  before: any;
  after: any;
  metrics: any;
}

export function BeforeAfterComparison({ before, after, metrics }: BeforeAfterComparisonProps) {
  return (
    <div className="p-4 bg-gray-800/20 rounded-lg h-64 flex items-center justify-center">
      <p className="text-geo-text-muted">Before/After Comparison Placeholder</p>
    </div>
  );
}
