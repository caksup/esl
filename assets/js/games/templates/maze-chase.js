import { createGame } from '../engine.js';
// Dedicated entry point for the Maze Chase template.
export function mount(ctx) { return createGame('maze-chase', ctx); }
