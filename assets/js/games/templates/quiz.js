import { createGame } from '../engine.js';
// Dedicated entry point for the Quiz template.
export function mount(ctx) { return createGame('quiz', ctx); }
