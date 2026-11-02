import { createGame } from '../engine.js';
// Dedicated entry point for the Whack A Mole template.
export function mount(ctx) { return createGame('whack-a-mole', ctx); }
