import { createGame } from '../engine.js';
// Dedicated entry point for the Win Or Lose Quiz template.
export function mount(ctx) { return createGame('win-or-lose-quiz', ctx); }
