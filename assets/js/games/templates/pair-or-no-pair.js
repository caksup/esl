import { createGame } from '../engine.js';
// Dedicated entry point for the Pair Or No Pair template.
export function mount(ctx) { return createGame('pair-or-no-pair', ctx); }
