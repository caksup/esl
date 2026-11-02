import { createGame } from '../engine.js';
// Dedicated entry point for the Unjumble template.
export function mount(ctx) { return createGame('unjumble', ctx); }
