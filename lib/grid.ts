import { STATE } from './state';

export function getGrid() {
  return STATE.currentGrid || new Map();
}