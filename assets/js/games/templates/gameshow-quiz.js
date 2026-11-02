import { createGame } from '../engine.js';
// Dedicated entry point for the Gameshow Quiz template.
export function mount(ctx) { return createGame('gameshow-quiz', ctx); }
