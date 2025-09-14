"use client";

import React from 'react';

interface RecommendationListProps {
  zones: any;
}

export function RecommendationList({ zones }: RecommendationListProps) {
  return (
    <div className="p-4 bg-gray-800/20 rounded-lg h-64 flex items-center justify-center">
      <p className="text-geo-text-muted">Recommendation List Placeholder</p>
    </div>
  );
}
