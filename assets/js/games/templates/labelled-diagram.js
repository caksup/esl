import { createGame } from '../engine.js';
// Dedicated entry point for the Labelled Diagram template.
export function mount(ctx) { return createGame('labelled-diagram', ctx); }
