import { createGame } from '../engine.js';
// Dedicated entry point for the Matching Pairs template.
export function mount(ctx) { return createGame('matching-pairs', ctx); }
