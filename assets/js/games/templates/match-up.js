import { createGame } from '../engine.js';
// Dedicated entry point for the Match Up template.
export function mount(ctx) { return createGame('match-up', ctx); }
