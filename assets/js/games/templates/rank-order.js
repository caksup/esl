import { createGame } from '../engine.js';
// Dedicated entry point for the Rank Order template.
export function mount(ctx) { return createGame('rank-order', ctx); }
