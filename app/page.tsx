'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import KPICard from '@/app/components/KPICard';
import ControlBar from '@/app/components/ControlBar';
import SimpleHeatmap from '@/app/components/SimpleHeatmap';
import UploadForm from '@/app/components/UploadForm';
import { InsightsDashboard } from '@/app/components/InsightsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Page() {
	const [kpis, setKpis] = useState<Record<string, unknown> | null>(null);
	const [simulationResult, setSimulationResult] = useState<Record<
		string,
		unknown
	> | null>(null);
	const [dataLoaded, setDataLoaded] = useState(false);
	const [forecastHorizon, setForecastHorizon] = useState('1h');

	const fetchKpis = useCallback(async () => {
		try {
			const res = await fetch('/api/kpi');
			if (res.ok) {
				const data = await res.json();
				setKpis(data);
			} else {
				console.warn(
					'Failed to fetch KPIs:',
					res.status,
					res.statusText
				);
			}
		} catch (error) {
			console.error('Error fetching KPIs:', error);
		}
	}, []);

	useEffect(() => {
		fetchKpis();
	}, [fetchKpis]);

	const handleDataLoad = useCallback(() => {
		setDataLoaded(true);
		fetchKpis();
	}, [fetchKpis]);

	const runSimulation = async () => {
		try {
			const res = await fetch('/api/simulate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ relocate_share: 0.1 }),
			});

			if (res.ok) {
				const data = await res.json();
				setSimulationResult(data);
				setKpis(data.kpi_after);
			} else {
				console.error('Simulation failed:', res.status, res.statusText);
			}
		} catch (error) {
			console.error('Error running simulation:', error);
		}
	};

	const ingestSampleData = async () => {
		try {
			const res = await fetch('/api/ingest', { method: 'POST' });
			if (res.ok) {
				handleDataLoad();
			} else {
				console.error(
					'Failed to load sample data:',
					res.status,
					res.statusText
				);
			}
		} catch (error) {
			console.error('Error loading sample data:', error);
		}
	};

	return (
		<div className="relative min-h-screen">
			{/* Background glows */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-geo-accent-blue/20 blur-3xl" />
				<div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-geo-accent-orange/20 blur-3xl" />
			</div>

			{/* Sticky Header */}
			<header className="sticky top-0 z-50 backdrop-blur-xl bg-geo-panel/70 border-b border-geo-border">
				<div className="container mx-auto flex items-center justify-between py-4">
					<div className="flex items-center gap-3">
						<div className="h-3 w-3 rounded-full bg-gradient-to-br from-geo-accent-blue to-geo-accent-orange geo-glow-blue" />
						<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
							inDrive Geo‑OS
						</h1>
					</div>
					<div className="flex items-center gap-2 text-sm text-geo-text-muted">
						<span
							className={`h-1.5 w-1.5 rounded-full ${
								dataLoaded
									? 'bg-geo-success'
									: 'bg-geo-text-muted'
							}`}
						/>
						{dataLoaded ? 'Data Connected' : 'No Data'}
					</div>
				</div>
			</header>

			{/* Hero */}
			<section className="container mx-auto px-4 pt-8 md:pt-12">
				<div className="flex flex-col md:flex-row gap-6">
					{/* Upload */}
					<div className="flex-1">
						<UploadForm onUploadComplete={handleDataLoad} />
					</div>
					{/* Quick Start */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="flex-1"
					>
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<span className="h-2 w-2 rounded-full bg-gradient-to-br from-geo-success to-emerald-500 geo-glow-blue" />
									Quick Start
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5">
								<p className="text-geo-text-muted">
									Use the pre-loaded Astana dataset to explore
									demand forecasting and optimization
									features.
								</p>
								<div className="text-center">
									<Button
										onClick={ingestSampleData}
										size="lg"
										className="geo-glow-blue bg-gradient-to-br from-geo-success to-emerald-500"
									>
										⚡ Load Sample Data
									</Button>
								</div>
								<div className="text-xs text-geo-text-muted">
									Tip: You can always upload your own CSV file
									later.
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* Controls */}
			<section className="container mx-auto px-4">
				<div className="max-w-md mx-auto">
					<ControlBar
						onSimulate={runSimulation}
						forecastHorizon={forecastHorizon}
						setForecastHorizon={setForecastHorizon}
					/>
				</div>
			</section>

			{/* KPIs */}
			<section className="container mx-auto px-4">
				{kpis && typeof kpis === 'object' && 'eta' in kpis && (
					<KPICard
						kpis={
							kpis as {
								eta: number;
								coverage: number;
								pickup_dist: number;
								anomalies_per_1k: number;
								co2_proxy: number;
							}
						}
					/>
				)}
			</section>

			{/* Simulation Results */}
			{simulationResult && (
				<section className="container mx-auto px-4">
					<Card className="w-full">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="h-2 w-2 rounded-full bg-gradient-to-br from-geo-accent-orange to-geo-accent-blue geo-glow-orange" />
								Simulation Results
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="bg-black/30 border border-geo-border rounded-xl p-4 text-xs font-mono text-geo-text-muted max-h-[300px] overflow-auto">
								<pre>
									{JSON.stringify(simulationResult, null, 2)}
								</pre>
							</div>
						</CardContent>
					</Card>
				</section>
			)}

			{/* Map */}
			<section className="mt-8 border-t border-geo-border bg-geo-panel/70">
				<div className="container mx-auto px-4 py-8">
					<div className="flex items-center gap-2 mb-6">
						<div className="h-2 w-2 rounded-full bg-gradient-to-br from-geo-accent-blue to-geo-accent-orange geo-glow-blue" />
						<h2 className="text-2xl font-bold">
							Geographic Visualization
						</h2>
					</div>
					<div className="h-[min(70vh,600px)] min-h-[400px] rounded-2xl border border-geo-border overflow-hidden shadow-2xl">
						<SimpleHeatmap
							dataLoaded={dataLoaded}
							forecastHorizon={forecastHorizon}
						/>
					</div>
					<div className="mt-3 flex items-center gap-2 text-xs text-geo-text-muted">
						<BadgeCheck className="h-3 w-3" />
						Map data updates based on selected forecast horizon
					</div>
				</div>
			</section>

			{/* Insights Dashboard */}
			<section className="mt-8 border-t border-geo-border bg-geo-panel/70">
				<div className="container mx-auto px-4 py-8">
					<div className="flex items-center gap-2 mb-6">
						<div className="h-2 w-2 rounded-full bg-gradient-to-br from-geo-accent-blue to-geo-accent-orange geo-glow-blue" />
						<h2 className="text-2xl font-bold">
							Insights Dashboard
						</h2>
					</div>
					<InsightsDashboard data={{}} />
				</div>
			</section>
		</div>
	);
}
