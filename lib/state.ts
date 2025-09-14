

import { Trajectory } from './types';

export interface H3Cell {
  h3: string;
  trips: number;
  avgSpd: number;
  wait_proxy: number;
}

// Global state with persistence checks
const globalStateSymbol = Symbol.for('geo-os-state');

function initializeState() {
  return {
    trajectories: new Map<string, Trajectory>(),
    currentGrid: new Map<string, H3Cell>(),
    zoneStats: {} as any,
    forecastTop: [] as any[],
    anoms: [] as any[],
    kpi: {} as any,
    lastUpdate: Date.now(),
  };
}

// Get or create global state
function getGlobalState() {
  if (!(globalThis as any)[globalStateSymbol]) {
    (globalThis as any)[globalStateSymbol] = initializeState();
  }
  return (globalThis as any)[globalStateSymbol];
}

export const STATE = getGlobalState();

// Function to reset state, useful for testing or re-runs
export function resetState() {
  STATE.trajectories.clear();
  STATE.currentGrid.clear();
  STATE.zoneStats = {};
  STATE.forecastTop = [];
  STATE.anoms = [];
  STATE.kpi = {};
  STATE.lastUpdate = Date.now();
  console.log("Application state has been reset.");
}

// Helper to check if state has data
export function hasData() {
  return STATE.currentGrid.size > 0;
}

// Debug function to check state
export function debugState() {
  console.log(`State debug: ${STATE.currentGrid.size} grid cells, last update: ${new Date(STATE.lastUpdate).toISOString()}`);
  return {
    gridSize: STATE.currentGrid.size,
    trajectoriesSize: STATE.trajectories.size,
    lastUpdate: STATE.lastUpdate,
    gridKeys: Array.from(STATE.currentGrid.keys()).slice(0, 5), // First 5 keys for debug
  };
}