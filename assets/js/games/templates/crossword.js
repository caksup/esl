import { createGame } from '../engine.js';
// Dedicated entry point for the Crossword template.
export function mount(ctx) { return createGame('crossword', ctx); }
