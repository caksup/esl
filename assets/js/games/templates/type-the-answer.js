import { createGame } from '../engine.js';
// Dedicated entry point for the Type The Answer template.
export function mount(ctx) { return createGame('type-the-answer', ctx); }
