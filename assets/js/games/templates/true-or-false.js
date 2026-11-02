import { createGame } from '../engine.js';
// Dedicated entry point for the True Or False template.
export function mount(ctx) { return createGame('true-or-false', ctx); }
