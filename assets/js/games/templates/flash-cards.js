import { createGame } from '../engine.js';
// Dedicated entry point for the Flash Cards template.
export function mount(ctx) { return createGame('flash-cards', ctx); }
