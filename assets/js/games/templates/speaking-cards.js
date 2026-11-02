import { createGame } from '../engine.js';
// Dedicated entry point for the Speaking Cards template.
export function mount(ctx) { return createGame('speaking-cards', ctx); }
