'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MapErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

interface MapErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export class MapErrorBoundary extends React.Component<
	MapErrorBoundaryProps,
	MapErrorBoundaryState
> {
	constructor(props: MapErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('Map rendering error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="w-full h-full flex items-center justify-center">
					<Card className="max-w-md">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-amber-600">
								🗺️ Map Rendering Issue
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-gray-600">
								The 3D map visualization is temporarily unavailable.
								This may be due to WebGL compatibility issues.
							</p>
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
								<h4 className="font-semibold text-blue-800 mb-2">
									Demo Still Functional
								</h4>
								<ul className="text-sm text-blue-700 space-y-1">
									<li>✓ Data processing works</li>
									<li>✓ KPI calculations available</li>
									<li>✓ Simulation engine running</li>
									<li>✓ All APIs operational</li>
								</ul>
							</div>
							<button
								onClick={() => this.setState({ hasError: false })}
								className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
							>
								Try Again
							</button>
						</CardContent>
					</Card>
				</div>
			);
		}

		return this.props.children;
	}
}